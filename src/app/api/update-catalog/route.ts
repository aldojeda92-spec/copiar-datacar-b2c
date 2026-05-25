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

function limpiarNumero(val: any): number | null {
  if (val === null || val === undefined) return null;
  const num = parseInt(val.toString().replace(/\D/g, ''));
  return isNaN(num) ? null : num;
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
      
      // Captura el precio del Excel (sea cual sea su nombre)
      const rawPrecio = row.precio_usd || row.precio;
      const precio_final = parseFloat(rawPrecio) || 0; 
      
      const combustible = row.combustible;
      const motor = row.motor;
      const transmision = row.transmision || row.transmisión;
      const traccion = row.traccion || row.tracción;
      
      const largo = limpiarNumero(row.largo);
      const ancho = limpiarNumero(row.ancho);
      const alto = limpiarNumero(row.alto);
      const despeje_suelo = limpiarNumero(row.despeje_suelo || row.despeje);
      
      // Captura los litros de baulera
      const rawBaulera = row.baulera || row.baul_litros || row.baulera_litros || row.baul;
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

      // SQL SOLUCIÓN: Inyectamos el mismo dato en precio/precio_usd y baulera/baulera_litros
      const insertQuery = `
        INSERT INTO catalogo_matriz (
          marca, modelo, version, concesionaria, tipo_carroceria, 
          precio, precio_usd, -- <--- Ambos reciben el precio
          combustible, motor, transmision, traccion, largo, ancho, alto, despeje_suelo, 
          baulera, baulera_litros, -- <--- Ambos reciben los litros
          plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla, conectividad,
          camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, -- <--- Enlazamos precio_final en ambos
          $8, $9, $10, $11, $12, $13, $14, $15, 
          $16, $17, -- <--- Enlazamos baulera_final en ambos
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        )
      `;
      
      await pool.query(insertQuery, [
        marca, modelo, version, concesionaria, tipo_carroceria, 
        precio_final, precio_final, // Mismo valor para precio y precio_usd
        combustible, motor, transmision, traccion, largo, ancho, alto, despeje_suelo, 
        baulera_final, baulera_final, // Mismo valor para baulera y baulera_litros
        plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla, conectividad,
        camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags
      ]);
      
      insertados++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `¡Catálogo sincronizado con éxito total (Doble Seguro)!`,
      detalles: `Se cargaron ${insertados} autos. Columnas duplicadas alineadas correctamente.`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
