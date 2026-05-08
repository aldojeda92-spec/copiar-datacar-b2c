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

    // Función auxiliar para ignorar valores de "selección total"
    const isNotAll = (v: string) => !['todas', 'todos', 'cualquiera', 'cualquier', ''].includes(v);

    const sTipo = parseData(leadData.tipoVehiculo).filter(isNotAll);
    const sConce = parseData(leadData.concesionariaPreferencia);
    const attrs = parseData(leadData.atributos);

    // 2. DICCIONARIO DE MOTORIZACIÓN (Intocable, traduce UI a Data Técnica)
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

    // DICCIONARIO DE ORIGEN (Traductor Frontend -> DB)
    const origenMap: Record<string, string[]> = {
      'solo chinos': ['china', 'chino', 'prc'],
      'solo japoneses': ['japón', 'japon', 'japonés', 'japones'],
      'solo coreanos': ['corea', 'coreano', 'corea del sur'],
      'solo europeos': ['europa', 'europeo', 'alemania', 'francia', 'inglaterra', 'italia', 'españa'],
      'solo usa': ['usa', 'eeuu', 'estados unidos', 'ee.uu.']
    };
    
    const sOrigenRaw = parseData(leadData.origen).filter(isNotAll);
    const sOrigenTarget = sOrigenRaw.flatMap(o => origenMap[o] || [o.replace('solo ', '')]);

    // SANITIZACIÓN DE PRECIOS
    const pMin = Math.floor(Number(leadData.presupuestoMin) || 0);
    const pMax = Math.floor(Number(leadData.presupuestoMax) || 999999);

    console.log(">>> [ARQUITECTURA] Payload M
