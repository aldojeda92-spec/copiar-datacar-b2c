import { NextResponse } from 'next/server';
// @ts-ignore
import { Pool } from 'pg'; 

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  // Si escriben menos de 2 letras, no gastamos recursos de la base de datos
  if (q.length < 2) return NextResponse.json({ autos: [] });

  try {
    // Pedimos las columnas exactas que nos pasaste de Neon
    const query = `
      SELECT 
        id, marca, modelo, version, concesionaria, tipo_carroceria,
        precio_usd, combustible, motor, transmision, traccion,
        baulera_litros, origen, origen_marca, url_imagen, garantia,
        subsegmento, largo, ancho, alto, despeje_suelo, plazas,
        adas, asiento_cuero, techo_panoramico, tamanho_pantalla,
        conectividad, camaras, airbags, precio, baulera, url_auto
      FROM catalogo_matriz
      WHERE marca ILIKE $1 OR modelo ILIKE $1
      ORDER BY marca ASC, precio_usd ASC
      LIMIT 15
    `;
    
    // Ejecutamos la búsqueda (el ILIKE permite que no importe si escriben en mayúsculas o minúsculas)
    const res = await pool.query(query, [`%${q}%`]);
    
    // TRADUCTOR EXACTO: Convertimos la tabla de Neon al formato que exige tu componente WizardContainer
    const autos = res.rows.map(row => ({
      id: row.id,
      puesto: 0, 
      match_percent: 99, // Etiqueta visual para indicar que fue una búsqueda manual
      marca: row.marca || '',
      modelo: row.modelo || '',
      version: row.version || '',
      precioUsd: row.precio_usd || row.precio || 0,
      origenMarca: row.origen_marca || '',
      combustible: row.combustible || '',
      urlImagen: row.url_imagen || '',
      motor: row.motor || '',
      traccion: row.traccion || '',
      transmision: row.transmision || '',
      // Si baulera_litros está vacío, intenta rescatar el número de la columna baulera (VARCHAR)
      bauleraLitros: row.baulera_litros || parseInt(row.baulera) || 0,
      garantia: row.garantia || '',
      adas: row.adas || '',
      airbags: row.airbags || '',
      tamanhoPantalla: row.tamanho_pantalla || '',
      camaras: row.camaras || '',
      plazas: row.plazas || 5,
      largo: row.largo || 0,
      ancho: row.ancho || 0,
      alto: row.alto || 0,
      despejeSuelo: row.despeje_suelo || 0,
      asientoCuero: row.asiento_cuero || '',
      techoPanoramico: row.techo_panoramico || '',
      conectividad: row.conectividad || '',
      concesionaria: row.concesionaria || '',
      veredicto: "Vehículo agregado manualmente desde el catálogo general.",
      versiones: [
        {
          id: row.id,
          version: row.version || '',
          precioUsd: row.precio_usd || row.precio || 0
        }
      ]
    }));

    return NextResponse.json({ autos });
    
  } catch (error: any) {
    console.error("ERROR EN BUSCADOR:", error.message);
    return NextResponse.json({ autos: [], error: error.message }, { status: 500 });
  }
}
