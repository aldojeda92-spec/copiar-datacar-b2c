import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
// @ts-ignore
import csv from 'csv-parser';
// @ts-ignore
import { Pool } from 'pg'; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
    
    // --- BORRÓN Y CUENTA NUEVA: Limpiamos la base de datos ---
    await pool.query('TRUNCATE TABLE catalogo_matriz CASCADE;');

    const results: any[] = [];
    const fileStream = fs.createReadStream(csvPath, 'utf-8');

    // Usamos csv-parser para leer el archivo de forma ultra-segura respetando comillas y saltos de línea
    await new Promise((resolve, reject) => {
      fileStream
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    let insertados = 0;

    for (const row of results) {
      // Si la fila no tiene concesionaria o marca, la saltamos
      if (!row.marca || !row.modelo) continue;

      const concesionaria = row.concesionaria;
      const marca = row.marca;
      const modelo = row.modelo;
      const version = row.version;
      const tipo_carroceria = row.tipo_carroceria;
      
      // Capturamos el precio de tu columna "precio" del CSV y lo convertimos a número limpio
      const precio_usd = parseFloat(row.precio) || 0; 
      
      const combustible = row.combustible;
      const motor = row.motor;
      const transmision = row.transmision;
      const traccion = row.traccion;
      const largo = parseInt(row.largo) || null;
      const ancho = parseInt(row.ancho) || null;
      const alto = parseInt(row.alto) || null;
      const despeje_suelo = parseInt(row.despeje_suelo) || null;
      const baulera = parseInt(row.baulera) || null;
      const plazas = parseInt(row.plazas) || 5;
      const adas = row.adas;
      const asiento_cuero = row.asiento_cuero;
      const techo_panoramico = row.techo_panoramico;
      const tamanho_pantalla = row.tamanho_pantalla;
      const conectividad = row.conectividad;
      const camaras = row.camaras;
      const garantia = row.garantia;
      const origen = row.origen;
      const origen_marca = row.origen_marca;
      const url_auto = row.url_auto;
      const url_imagen = row.url_imagen;
      const subsegmento = row.subsegmento || null;
      const airbags = row.airbags || null;

      const insertQuery = `
        INSERT INTO catalogo_matriz (
          marca, modelo, version, concesionaria, tipo_carroceria, precio_usd, combustible,
          motor, transmision, traccion, largo, ancho, alto, despeje_suelo, baulera,
          plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla, conectividad,
          camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        )
      `;
      
      await pool.query(insertQuery, [
        marca, modelo, version, concesionaria, tipo_carroceria, precio_usd, combustible,
        motor, transmision, traccion, largo, ancho, alto, despeje_suelo, baulera,
        plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla, conectividad,
        camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags
      ]);
      
      insertados++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `¡Catálogo sincronizado con éxito total!`,
      detalles: `Se limpió la base de datos y se cargaron ${insertados} autos con sus precios reales.`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
