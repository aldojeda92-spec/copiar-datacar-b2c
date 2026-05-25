export const dynamic = 'force-dynamic';

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

// Extractor de números ultra-potente mediante expresiones regulares (Busca solo los dígitos puros)
function limpiarNumero(val: any): number {
  if (val === null || val === undefined) return 0;
  const match = val.toString().match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
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
      // Función interna para buscar las columnas de forma dinámica por aproximación de palabras
      const findKey = (word: string) => Object.keys(row).find(k => k.toLowerCase().includes(word));

      const kMarca = findKey('marca');
      const kModelo = findKey('modelo');
      
      if (!kMarca || !kModelo || !row[kMarca] || !row[kModelo]) continue;

      const marca = row[kMarca];
      const modelo = row[kModelo];
      
      const kConcesionaria = findKey('concesionaria');
      const concesionaria = kConcesionaria ? row[kConcesionaria] : '';
      
      const kVersion = findKey('version');
      const version = kVersion ? row[kVersion] : '';
      
      const kCarroceria = findKey('carroceria') || findKey('carrocería');
      const tipo_carroceria = kCarroceria ? row[kCarroceria] : '';
      
      const kPrecio = findKey('precio');
      const precio_final = kPrecio ? parseFloat(row[kPrecio]) || 0 : 0;
      
      const kCombustible = findKey('combustible');
      const combustible = kCombustible ? row[kCombustible] : '';
      
      const kMotor = findKey('motor');
      const motor = kMotor ? row[kMotor] : '';
      
      const kTransmision = findKey('transmision') || findKey('transmisión');
      const transmision = kTransmision ? row[kTransmision] : '';
      
      const kTraccion = findKey('traccion') || findKey('tracción');
      const traccion = kTraccion ? row[kTraccion] : '';
      
      const kLargo = findKey('largo');
      const largo = kLargo ? limpiarNumero(row[kLargo]) : null;
      
      const kAncho = findKey('ancho');
      const ancho = kAncho ? limpiarNumero(row[kAncho]) : null;
      
      const kAlto = findKey('alto');
      const alto = kAlto ? limpiarNumero(row[kAlto]) : null;
      
      const kDespeje = findKey('despeje');
      const despeje_suelo = kDespeje ? limpiarNumero(row[kDespeje]) : null;
      
      // ESCÁNER DINÁMICO DE BAULERA DEFINITIVO (Rastrea y extrae cualquier columna con la palabra 'baul')
      const kBaulera = findKey('baul');
      const baulera_final = kBaulera ? limpiarNumero(row[kBaulera]) : 0;
      
      const kPlazas = findKey('plazas');
      const plazas = kPlazas ? limpiarNumero(row[kPlazas]) : 5;
      
      const kAdas = findKey('adas');
      const adas = kAdas ? row[kAdas] : '';
      
      const kCuero = findKey('cuero');
      const asiento_cuero = kCuero ? row[kCuero] : '';
      
      const kTecho = findKey('techo');
      const techo_panoramico = kTecho ? row[kTecho] : '';
      
      const kPantalla = findKey('pantalla');
      const tamanho_pantalla = kPantalla ? row[kPantalla] : '';
      
      const kConectividad = findKey('conectividad');
      const conectividad = kConectividad ? row[kConectividad] : '';
      
      const kCamaras = findKey('camaras') || findKey('cámaras');
      const camaras = kCamaras ? row[kCamaras] : '';
      
      const kGarantia = findKey('garantia') || findKey('garantía');
      const garantia = kGarantia ? row[kGarantia] : '';
      
      const kOrigen = findKey('origen');
      const origen = kOrigen ? row[kOrigen] : '';
      
      const kOrigenMarca = findKey('origen_marca');
      const origen_marca = kOrigenMarca ? row[kOrigenMarca] : '';
      
      const kUrlAuto = findKey('url_auto');
      const url_auto = kUrlAuto ? row[kUrlAuto] : '';
      
      const kUrlImagen = findKey('url_imagen');
      const url_imagen = kUrlImagen ? row[kUrlImagen] : '';
      
      const kSubsegmento = findKey('subsegmento');
      const subsegmento = kSubsegmento ? row[kSubsegmento] : null;
      
      const kAirbags = findKey('airbags');
      const airbags = kAirbags ? row[kAirbags] : null;

      // SQL unificado: Forzamos el almacenamiento duplicado en "baulera" y "baulera_litros"
      const insertQuery = `
        INSERT INTO catalogo_matriz (
          marca, modelo, version, concesionaria, tipo_carroceria, 
          precio, precio_usd, 
          combustible, motor, transmision, traccion, largo, ancho, alto, despeje_suelo, 
          baulera, baulera_litros, 
          plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla, conectividad,
          camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, 
          $8, $9, $10, $11, $12, $13, $14, $15, 
          $16, $17, 
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        )
      `;
      
      await pool.query(insertQuery, [
        marca, modelo, version, concesionaria, tipo_carroceria, 
        precio_final, precio_final, 
        combustible, motor, transmision, traccion, largo, ancho, alto, despeje_suelo, 
        baulera_final, baulera_final, 
        plazas, adas, asiento_cuero, techo_panoramico, tamanho_pantalla, conectividad,
        camaras, garantia, origen, origen_marca, url_auto, url_imagen, subsegmento, airbags
      ]);
      
      insertados++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `¡Catálogo sincronizado con éxito total (Doble Seguro + Escáner Dinámico)!`,
      detalles: `Se cargaron ${insertados} autos. Columnas duplicadas y litros de baulera corregidos al 100%.`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
