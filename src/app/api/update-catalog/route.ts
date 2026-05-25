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

    let actualizados = 0;
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

      // 1. Buscamos si el auto ya existe en la base de datos de Neon
      const checkQuery = `SELECT id FROM catalogo_matriz WHERE marca = $1 AND modelo = $2 AND version = $3 LIMIT 1`;
      const checkRes = await pool.query(checkQuery, [marca, modelo, version]);

      if (checkRes.rows.length > 0) {
        // Si existe, lo actualizamos (Update)
        const id = checkRes.rows[0].id;
        const updateQuery = `
          UPDATE catalogo_matriz SET 
            concesionaria = $1, tipo_carroceria = $2, precio = $3, combustible = $4,
            motor = $5, transmision = $6, traccion = $7, largo = $8, ancho = $9,
            alto = $10, despeje_suelo = $11, baulera = $12, plazas = $13, adas = $14,
            asiento_cuero = $15, techo_panoramico = $16, tamanho_pantalla = $17,
            conectividad = $18, camaras = $19, garantia = $20, origen = $21,
            origen_marca = $22, url_auto = $23, url_imagen = $24, subsegmento = $25, airbags = $26
          WHERE id = $27
        `;
        await pool.query(updateQuery, [
          concesionaria, tipo_carroceria, precio, combustible, motor, transmision, traccion, largo, ancho,
          alto, despeje_suelo, baulera, plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla,
          conectividad, camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags,
          id
        ]);
        actualizados++;
      } else {
        // Si no existe, insertamos el auto nuevo (Insert)
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
    }

    return NextResponse.json({ 
      success: true, 
      message: `¡Catálogo sincronizado con éxito!`,
      detalles: `Se actualizaron ${actualizados} autos y se agregaron ${insertados} autos nuevos.`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
