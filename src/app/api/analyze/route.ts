import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { catalogoMatriz, leads } from '@/lib/schema';
import { eq, and, gte, lte, ilike, or } from 'drizzle-orm';

export const maxDuration = 60;

export async function POST(req: Request) {
  const start = Date.now();
  
  try {
    const { leadId } = await req.json();
    const leadData = await db.query.leads.findFirst({ where: eq(leads.id, leadId) });
    
    if (!leadData) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    // 1. PARSEO ANTIBALAS (Limpieza de inputs)
    const parseData = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map(v => String(v).trim().toLowerCase());
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed.map(v => String(v).trim().toLowerCase());
        } catch (e) {
          return val.split(',').map(v => v.trim().toLowerCase());
        }
      }
      return [String(val).trim().toLowerCase()];
    };

    const isNotAll = (v: string) => !['todas', 'todos', 'cualquiera', 'cualquier', ''].includes(v);

    const sTipo = parseData(leadData.tipoVehiculo).filter(isNotAll);
    const sConce = parseData(leadData.concesionariaPreferencia);
    const attrs = parseData(leadData.atributos);

    // 2. DICCIONARIO DE MOTORIZACIÓN
    const motorMap: Record<string, string[]> = {
      'hev': ['híbrido', 'hybrid', 'autorrecargable', 'hev', 'mhev'],
      'phev': ['enchufable', 'plug-in', 'phev', 'híbrido enchufable'],
      'bev': ['eléctrico', 'ev', '100% eléctrico', 'bev', 'electric'],
      'flex': ['flex', 'alcohol', 'etanol'],
      'diesel': ['diesel', 'diésel', 'gasoil'],
      'nafta': ['nafta', 'gasolina', 'gas']
    };
    
    const sMotorRaw = parseData(leadData.motorizacion).filter(isNotAll);
    const sMotorTarget = sMotorRaw.flatMap(m => motorMap[m] || [m]);

    const origenMap: Record<string, string[]> = {
      'solo chinos': ['china', 'chino', 'prc'],
      'solo japoneses': ['japón', 'japon', 'japonés', 'japones'],
      'solo coreanos': ['corea', 'coreano', 'corea del sur'],
      'solo europeos': ['europa', 'europeo', 'alemania', 'francia', 'inglaterra', 'italia', 'españa'],
      'solo usa': ['usa', 'eeuu', 'estados unidos', 'ee.uu.']
    };
    
    const sOrigenRaw = parseData(leadData.origen).filter(isNotAll);
    const sOrigenTarget = sOrigenRaw.flatMap(o => origenMap[o] || [o.replace('solo ', '')]);

    const pMin = Math.floor(Number(leadData.presupuestoMin) || 0);
    const pMax = Math.floor(Number(leadData.presupuestoMax) || 999999);

    // 3. SQL QUIRÚRGICO (HARD FILTERS)
    const queryConditions = [
      gte(catalogoMatriz.precioUsd, pMin),
      lte(catalogoMatriz.precioUsd, pMax)
    ];

    if (sTipo.length > 0) {
      queryConditions.push(or(...sTipo.map(t => ilike(catalogoMatriz.tipoCarroceria, `%${t}%`)))!);
    }

    if (sMotorTarget.length > 0) {
      const motorConditions = sMotorTarget.flatMap(m => [
        ilike(catalogoMatriz.combustible, `%${m}%`),
        ilike(catalogoMatriz.motor, `%${m}%`)
      ]);
      queryConditions.push(or(...motorConditions)!);
    }

    if (sOrigenTarget.length > 0) {
      queryConditions.push(or(...sOrigenTarget.map(o => ilike(catalogoMatriz.origenMarca, `%${o}%`)))!);
    }

    let candidatosEstrictos = await db.select().from(catalogoMatriz).where(and(...queryConditions));

    // --- LÓGICA DE RESCATE (NUEVA) ---
    let esRescate = false;
    let resultadosParaProcesar = candidatosEstrictos;

    if (candidatosEstrictos.length === 0) {
      console.log(">>> [RESCATE] No hay resultados exactos. Relajando filtros...");
      const condicionesRescate = [
        gte(catalogoMatriz.precioUsd, pMin),
        lte(catalogoMatriz.precioUsd, pMax)
      ];
      if (sTipo.length > 0) {
        condicionesRescate.push(or(...sTipo.map(t => ilike(catalogoMatriz.tipoCarroceria, `%${t}%`)))!);
      }
      // Traemos una muestra más amplia para que el algoritmo de concesionaria pueda ordenar
      resultadosParaProcesar = await db.select().from(catalogoMatriz).where(and(...condicionesRescate));
      esRescate = true;
    }

    if (resultadosParaProcesar.length === 0) {
      return NextResponse.json({ success: true, top10: [], esRescate: false });
    }

    // 4. ALGORITMO DATACAR MATCH SCORE (Scoring Dinámico)
    const candidatosConConcesionaria = resultadosParaProcesar.map(auto => {
      const dbConce = (auto.concesionaria || "").toLowerCase();
      const isConceMatch = sConce.length === 0 || sConce.some(c => ['todas', 'todos'].includes(c)) || sConce.some(c => dbConce.includes(c));
      return { ...auto, isConceMatch };
    });

    const minPrice = Math.min(...candidatosConConcesionaria.map(a => a.precioUsd ?? 0));
    const maxPrice = Math.max(...candidatosConConcesionaria.map(a => a.precioUsd ?? 0));

    let candidatosPuntuados = candidatosConConcesionaria.map(auto => {
      let score = 70;
      if (auto.isConceMatch) score += 15;
      const p = auto.precioUsd ?? 0;
      if (maxPrice === minPrice) {
        score += 15;
      } else {
        score += Math.round(15 * (1 - ((p - minPrice) / (maxPrice - minPrice))));
      }
      return { ...auto, matchPercent: score };
    });

    candidatosPuntuados.sort((a, b) => b.matchPercent - a.matchPercent || (a.precioUsd ?? 0) - (b.precioUsd ?? 0));

    // 4.5. EXTRACCIÓN DEL TOP (10 si es match, 5 si es rescate)
    const vistos = new Set();
    let finalTop = [];
    const limite = esRescate ? 5 : 10;
    
    for (const a of candidatosPuntuados) {
      if (!vistos.has(a.modelo) && finalTop.length < limite) {
        vistos.add(a.modelo);
        finalTop.push(a);
      }
    }

    // 5. IA: PIPELINE DE DATOS (Solo se activa si NO es rescate para mantener veredictos técnicos reales)
    let veredictosArray: any[] = [];
    if (finalTop.length > 0 && !esRescate) {
      try {
        const aiPayload = finalTop.map((a, index) => ({
          index,
          precio: a.precioUsd,
          motor: a.combustible,
          airbags: a.airbags,
          adas: a.adas ? "Equipado" : "Básico",
          pantalla: a.tamanhoPantalla,
          plazas: a.plazas,
          baulera: a.bauleraLitros
        }));

        const prompt = `Actúa como Analista de Datos de DATACAR. Recibirás un JSON con ${finalTop.length} vehículos. TAREA OBLIGATORIA: Escribe un 'veredicto' comparativo de máximo 15 palabras para CADA UNO. REGLAS: 1. NO menciones marcas ni modelos. 2. Compara entre sí. 3. Devuelve ÚNICAMENTE un array JSON: [{"index": 0, "veredicto": "..."}]. Datos: ${JSON.stringify(aiPayload)}`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const aiData = await aiRes.json();
        const textResponse = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        const match = textResponse.match(/\[[\s\S]*\]/);
        if (match) {
          veredictosArray = JSON.parse(match[0]);
        }
      } catch (e) {
        console.error(">>> [ERROR IA]:", e);
      }
    }

    // 6. RESPUESTA FINAL MAPEADA
    const top10 = await Promise.all(finalTop.map(async (auto, i) => {
      const vRaw = await db.query.catalogoMatriz.findMany({
        where: eq(catalogoMatriz.modelo, auto.modelo ?? ""),
        orderBy: [catalogoMatriz.precioUsd]
      });

      const veredictoObj = veredictosArray.find((v: any) => v.index === i);

      return {
        ...auto,
        match_percent: esRescate ? 65 : auto.matchPercent, // Bajamos el match score visual si es recomendación
        esRecomendacion: esRescate,
        veredicto: esRescate 
          ? "No encontramos un match exacto, pero esta opción se ajusta a tu presupuesto y tipo de carrocería."
          : veredictoObj?.veredicto || "Opción destacada que cumple estrictamente con tu configuración y presupuesto.",
        versiones: vRaw.map(v => ({ ...v, match_percent: esRescate ? 65 : auto.matchPercent }))
      };
    }));

    console.log(`>>> [ARQUITECTURA] Pipeline Completado. Rescate: ${esRescate}. Tiempo: ${Date.now() - start}ms`);
    return NextResponse.json({ success: true, top10, esRescate });

  } catch (error: any) {
    console.error(">>> [FATAL ERROR]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
