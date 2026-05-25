import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { Pool } from 'pg'; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/);
  // Eliminamos la cabecera
  lines.shift(); 
  
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
    const csvPath = path.join(process.cwd(), 'matriz4.csv');
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'Archivo matriz4.csv no encontrado' }, { status: 404 });
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvContent);

    // --- BORRÓN Y CUENTA NUEVA: Limpiamos por completo la tabla de Neon ---
    await pool.query('TRUNCATE TABLE catalogo_matriz CASCADE;');

    let insertados = 0;

    for (const row of rows) {
      // Tu Excel tiene 29 columnas. Ignoramos líneas vacías o rotas
      if (row.length < 28) continue; 

      const concesionaria = row[0];
      const marca = row[1];
      const modelo = row[2];
      const version = row[3];
      const tipo_carroceria = row[4];
      const precio = parseFloat(row[5]) || 0;
      const combustible = row[6];
      const motor = row[7];
      const transmision = row[8];
      const traccion = row[9];
      const largo = parseInt(row[10]) || null;
      const ancho = parseInt(row[11]) || null;
      const alto = parseInt(row[12]) || null;
      const despeje_suelo = parseInt(row[13]) || null;
      const baulera = parseInt(row[14]) || null;
      const plazas = parseInt(row[15]) || 5;
      const adas = row[16];
      const asiento_cuero = row[17];
      const techo_panoramico = row[18];
      const tamanho_pantalla = row[19];
      const conectividad = row[20];
      const camaras = row[21];
      const garantia = row[22];
      const origen = row[23];
      const origen_marca = row[24];
      const url_auto = row[25];
      const url_imagen = row[26];
      const subsegmento = row[27] || null;
      const airbags = row[28] || null;

      // Insertamos el auto de manera directa en la tabla limpia
      const insertQuery = `
        INSERT INTO catalogo_matriz (
          marca, modelo, version, concesionaria, tipo_carroceria, precio, combustible,
          motor, transmision, traccion, largo, ancho, alto, despeje_suelo, baulera,
          plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla, conectividad,
          camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        )
      `;
      
      await pool.query(insertQuery, [
        marca, modelo, version, concesionaria, tipo_carroceria, precio, combustible,
        motor, transmision, traccion, largo, ancho, alto, despeje_suelo, baulera,
        plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla, conectividad,
        camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags
      ]);
      
      insertados++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `¡Catálogo sincronizado con éxito (Borrón y cuenta nueva)!`,
      detalles: `Se vació la base de datos por completo y se cargaron ${insertados} autos frescos desde tu archivo Excel.`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
