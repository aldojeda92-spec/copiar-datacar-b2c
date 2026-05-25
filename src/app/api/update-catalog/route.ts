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

// Función mejorada y ultra-flexible para extraer números de la baulera
function limpiarNumero(val: any): number {
  if (val === null || val === undefined) return 0;
  
  // Limpiamos espacios y quitamos cualquier texto que no sea número
  const stringVal = val.toString().trim();
  if (stringVal === '' || stringVal === '-') return 0;
  
  const num = parseInt(stringVal.replace(/\D/g, ''));
  return isNaN(num) ? 0 : num;
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
    
    // --- BORRÓN Y CUENTA NUEVA: Limpiamos la base de datos ---
    await pool.query('TRUNCATE TABLE catalogo_matriz CASCADE;');

    const results: any[] = [];
    const fileStream = fs.createReadStream(csvPath, 'utf-8');

    await new Promise((resolve, reject) => {
      fileStream
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase()
        }))
        .on('data', (data: any) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    let insertados = 0;

    for (const row of results) {
      if (!row.marca || !row.modelo) continue;

      const concesionaria = row.concesionaria;
      const marca = row.marca;
      const modelo = row.modelo;
      const version = row.version;
      const tipo_carroceria = row.tipo_carroceria || row.tipo_carrocería;
      
      const rawPrecio = row.precio_usd || row.precio;
      const precio_final = parseFloat(rawPrecio) || 0; 
      
      const combustible = row.combustible;
      const motor = row.motor;
      const transmision = row.transmision || row.transmisión;
      const traccion = row.traccion || row.tracción;
      
      // Procesamos las dimensiones de forma segura (si fallan, quedan en 0)
      const largo = limpiarNumero(row.largo);
      const ancho = limpiarNumero(row.ancho);
      const alto = limpiarNumero(row.alto);
      const despeje_suelo = limpiarNumero(row.despeje_suelo || row.despeje);
      
      // SENSOR DETECTOR DE BAULERA INDESTRUCTIBLE:
      // Busca en el objeto de forma exhaustiva bajo cualquier variante de nombre
      const rawBaulera = row.baulera || row.baul_litros || row.baulera_litros || row.baul || row['baulera (litros)'];
      const baulera_final = limpiarNumero(rawBaulera);
      
      const plazas = limpiarNumero(row.plazas) || 5;
      const adas = row.adas;
      const asiento_cuero = row.asiento_cuero;
      const techo_panoramico = row.techo_panoramico || row.techo_panorámico;
      const tamanho_pantalla = row.tamanho_pantalla || row.tamano_pantalla || row.tamaño_pantalla;
      const conectividad = row.conectividad;
      const camaras = row.camaras || row.cámaras;
      const garantia = row.garantia || row.garantía;
      const origen = row.origen;
      const origen_marca = row.origen_marca;
      const url_auto = row.url_auto;
      const url_imagen = row.url_imagen;
      const subsegmento = row.subsegmento || null;
      const airbags = row.airbags || null;

      // SQL de Doble Seguro: Forzamos la baulera numérica en ambos campos de Neon
      const insertQuery = `
        INSERT INTO catalogo_matriz (
          marca, modelo, version, concesionaria, tipo_carroceria, 
          precio, precio_usd, 
          combustible, motor, transmision, traccion, largo, ancho, alto, despeje_suelo, 
          baulera, baulera_litros, -- <--- Ambas columnas reciben los litros procesados
          plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla, conectividad,
          camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, 
          $8, $9, $10, $11, $12, $13, $14, $15, 
          $16, $17, -- <--- Enlazamos baulera_final para ambas posiciones
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        )
      `;
      
      await pool.query(insertQuery, [
        marca, modelo, version, concesionaria, tipo_carroceria, 
        precio_final, precio_final, 
        combustible, motor, transmision, traccion, largo, ancho, alto, despeje_suelo, 
        baulera_final, baulera_final, // Inyectamos el valor purificado en las dos columnas
        plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla, conectividad,
        camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags
      ]);
      
      insertados++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `¡Catálogo sincronizado con éxito total (Doble Seguro + Baulera Fix)!`,
      detalles: `Se cargaron ${insertados} autos. Precios y Litros de baulera unificados al 100%.`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
