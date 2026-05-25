import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg'; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/);
  const headers = lines.shift(); 
  
  return lines.filter(line => line.trim() !== '').map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, '').trim());
    return result;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'datacar_secreto_2026') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // Buscamos el archivo directamente en la raíz del proyecto
    const csvPath = path.join(process.cwd(), 'matriz4.csv');
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'Archivo matriz4.csv no encontrado' }, { status: 404 });
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvContent);

    const queryText = `
      INSERT INTO catalogo_matriz (
        id, puesto, match_percent, marca, modelo, version, precio_usd, origen_marca, combustible,
        url_imagen, motor, traccion, transmision, baulera_litros, garantia, adas, airbags,
        tamanho_pantalla, camaras, plazas, largo, ancho, alto, despeje_suelo, asiento_cuero,
        techo_panoramico, conectividad, concesionaria, veredicto
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      )
      ON CONFLICT (id) 
      DO UPDATE SET 
        puesto = EXCLUDED.puesto,
        match_percent = EXCLUDED.match_percent,
        precio_usd = EXCLUDED.precio_usd,
        url_imagen = EXCLUDED.url_imagen,
        veredicto = EXCLUDED.veredicto,
        adas = EXCLUDED.adas,
        airbags = EXCLUDED.airbags,
        tamanho_pantalla = EXCLUDED.tamanho_pantalla,
        camaras = EXCLUDED.camaras,
        baulera_litros = EXCLUDED.baulera_litros,
        despeje_suelo = EXCLUDED.despeje_suelo;
    `;

    let actualizados = 0;
    for (const row of rows) {
      if (row.length < 5) continue; 
      const values = [
        row[0], parseInt(row[1]) || 0, parseInt(row[2]) || 0, row[3], row[4], row[5], 
        parseFloat(row[6]) || 0, row[7], row[8], row[9] || null, row[10] || null, 
        row[11] || null, row[12] || null, parseInt(row[13]) || null, row[14] || null, 
        row[15] || null, row[16] || null, row[17] || null, row[18] || null, 
        parseInt(row[19]) || 5, parseInt(row[20]) || null, parseInt(row[21]) || null, 
        parseInt(row[22]) || null, parseInt(row[23]) || null, row[24] || null, 
        row[25] || null, row[26] || null, row[27] || null, row[28] || 'Analizando datos...'
      ];
      await pool.query(queryText, values);
      actualizados++;
    }

    return NextResponse.json({ success: true, message: `Catálogo sincronizado. ${actualizados} autos procesados.` });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
