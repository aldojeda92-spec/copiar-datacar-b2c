import { NextResponse } from 'next/server';
// @ts-ignore
import { Pool } from 'pg'; 

// Obligamos a Vercel a no cachear esta ruta jamás
export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  query_timeout: 5000 
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ autos: [] }, { status: 200 });
    }

    const searchTerm = `%${q.trim()}%`;

    // SOLUCIÓN INDESTRUCTIBLE: SELECT * trae todo lo que existe en la tabla actualmente.
    // Ordenamos por precio_usd tal como queríamos.
    const query = `
      SELECT *
      FROM catalogo_matriz
      WHERE marca ILIKE $1 OR modelo ILIKE $1
      ORDER BY precio_usd ASC
      LIMIT 15
    `;
    
    const res = await pool.query(query, [searchTerm]);
    
    // Mapeamos los datos crudos a la estructura que necesita tu Frontend
    const autos = res.rows.map(row => ({
      id: row.id,
      puesto: 0, 
      match_percent: 99, 
      marca: row.marca ?? 'Desconocida',
      modelo: row.modelo ?? 'Sin Modelo',
      version: row.version ?? 'STD',
      // Priorizamos precio_usd, y si por algún motivo no viene, usamos precio
      precioUsd: Number(row.precio_usd) || Number(row.precio) || 0,
      origenMarca: row.origen_marca ?? 'No especificado',
      combustible: row.combustible ?? '',
      urlImagen: row.url_imagen ?? '',
      motor: row.motor ?? '',
      traccion: row.traccion ?? '',
      transmision: row.transmision ?? '',
      // Priorizamos baulera_litros
      bauleraLitros: Number(row.baulera_litros) || parseInt(row.baulera || '0', 10) || 0,
      garantia: row.garantia ?? '',
      adas: row.adas ?? '',
      airbags: row.airbags ?? '',
      tamanhoPantalla: row.tamanho_pantalla ?? '',
      camaras: row.camaras ?? '',
      plazas: Number(row.plazas) || 5,
      largo: Number(row.largo) || 0,
      ancho: Number(row.ancho) || 0,
      alto: Number(row.alto) || 0,
      despejeSuelo: Number(row.despeje_suelo) || 0,
      asientoCuero: row.asiento_cuero ?? '',
      techoPanoramico: row.techo_panoramico ?? '',
      conectividad: row.conectividad ?? '',
      concesionaria: row.concesionaria ?? '',
      veredicto: "Vehículo agregado manualmente desde el buscador.",
      versiones: [
        {
          id: row.id,
          version: row.version ?? 'STD',
          precioUsd: Number(row.precio_usd) || Number(row.precio) || 0
        }
      ]
    }));

    return NextResponse.json({ autos }, { status: 200 });
    
  } catch (error: any) {
    console.error("[CRÍTICO] Error en API /search-autos:", error);
    return NextResponse.json(
      { autos: [], message: "Error interno", errorDetail: error.message }, 
      { status: 500 }
    );
  }
}
