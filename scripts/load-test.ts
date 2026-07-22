import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env');
  process.exit(1);
}

// Inicializar cliente
const supabase = createClient(supabaseUrl, supabaseKey);

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
let concurrency = 5;
let durationSeconds = 10;
let mode: 'read' | 'write' | 'mixed' = 'read';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--concurrency' && args[i + 1]) {
    concurrency = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--duration' && args[i + 1]) {
    durationSeconds = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--mode' && args[i + 1]) {
    const val = args[i + 1].toLowerCase();
    if (val === 'read' || val === 'write' || val === 'mixed') {
      mode = val as any;
    }
    i++;
  }
}

interface RequestMetric {
  operation: string;
  startTime: number;
  duration: number;
  success: boolean;
  error?: string;
}

const metrics: RequestMetric[] = [];
let testRunning = true;

// Helper para generar datos aleatorios
function randomString(length: number): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

// Operaciones soportadas
async function performRead(): Promise<{ success: boolean; error?: string; op: string }> {
  const isLeads = Math.random() > 0.5;
  const table = isLeads ? 'leads' : 'inventory';
  const op = `read_${table}`;
  
  try {
    const { error } = await supabase.from(table).select('*').limit(10);
    if (error) {
      return { success: false, error: error.message, op };
    }
    return { success: true, op };
  } catch (err: any) {
    return { success: false, error: err.message || String(err), op };
  }
}

async function performWrite(): Promise<{ success: boolean; error?: string; op: string }> {
  const op = 'write_lead';
  const email = `load-test-${randomString(8)}@example.com`;
  const name = `Load Test Lead ${randomString(5)}`;
  
  try {
    // 1. Insertar lead temporal
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        name,
        email,
        phone: `+34600${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'nuevo',
        source: 'load_test',
        notes: 'Registro temporal creado durante prueba de carga.'
      }])
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message, op };
    }

    if (data && data.id) {
      // 2. Eliminar el lead creado para no ensuciar la base de datos
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', data.id);

      if (deleteError) {
        // Logueamos pero no marcamos como fallo de la inserción propiamente dicha
        console.warn(`⚠️ Advertencia: No se pudo eliminar lead temporal con ID ${data.id}: ${deleteError.message}`);
      }
    }

    return { success: true, op };
  } catch (err: any) {
    return { success: false, error: err.message || String(err), op };
  }
}

// Bucle del worker
async function worker(workerId: number) {
  while (testRunning) {
    const opType = mode === 'mixed'
      ? (Math.random() > 0.8 ? 'write' : 'read')
      : mode;

    const startTime = Date.now();
    let result;

    if (opType === 'read') {
      result = await performRead();
    } else {
      result = await performWrite();
    }

    const duration = Date.now() - startTime;
    metrics.push({
      operation: result.op,
      startTime,
      duration,
      success: result.success,
      error: result.error
    });

    // Pequeña pausa para no saturar al cliente en un bucle síncrono infinito
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

function calculatePercentile(sortedList: number[], percentile: number): number {
  if (sortedList.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedList.length) - 1;
  return sortedList[Math.max(0, index)];
}

async function runLoadTest() {
  console.log('==================================================');
  console.log('       INICIANDO PRUEBA DE CARGA DE SUPABASE      ');
  console.log('==================================================');
  console.log(`URL:         ${supabaseUrl}`);
  console.log(`Concurrencia: ${concurrency} workers concurrentes`);
  console.log(`Duración:    ${durationSeconds} segundos`);
  console.log(`Modo:        ${mode.toUpperCase()}`);
  console.log('==================================================\n');

  // Iniciar workers
  const workerPromises = Array.from({ length: concurrency }).map((_, idx) => worker(idx));

  // Esperar la duración del test
  let elapsed = 0;
  const interval = setInterval(() => {
    elapsed += 2;
    const progress = Math.min(100, Math.round((elapsed / durationSeconds) * 100));
    console.log(`... Progreso: ${progress}% (${elapsed}s / ${durationSeconds}s) - Solicitudes procesadas hasta ahora: ${metrics.length}`);
  }, 2000);

  await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
  testRunning = false;
  clearInterval(interval);

  // Esperar a que terminen los workers
  await Promise.all(workerPromises);

  console.log('\n==================================================');
  console.log('             PROCESANDO RESULTADOS                ');
  console.log('==================================================\n');

  if (metrics.length === 0) {
    console.error('❌ No se recopilaron métricas. Posiblemente los workers fallaron inmediatamente.');
    return;
  }

  // Análisis de métricas
  const totalRequests = metrics.length;
  const successfulRequests = metrics.filter(m => m.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const successRate = (successfulRequests / totalRequests) * 100;
  const rps = totalRequests / durationSeconds;

  const latencies = metrics.map(m => m.duration).sort((a, b) => a - b);
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const sumLatency = latencies.reduce((sum, current) => sum + current, 0);
  const avgLatency = sumLatency / totalRequests;

  const p50 = calculatePercentile(latencies, 50);
  const p90 = calculatePercentile(latencies, 90);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);

  // Agrupación por tipo de operación
  const opGroups: Record<string, { total: number; success: number; latencies: number[] }> = {};
  for (const metric of metrics) {
    if (!opGroups[metric.operation]) {
      opGroups[metric.operation] = { total: 0, success: 0, latencies: [] };
    }
    opGroups[metric.operation].total++;
    if (metric.success) {
      opGroups[metric.operation].success++;
    }
    opGroups[metric.operation].latencies.push(metric.duration);
  }

  // Mostrar resultados en consola
  console.log(`Peticiones Totales:       ${totalRequests}`);
  console.log(`Peticiones Exitosas:      ${successfulRequests} (${successRate.toFixed(2)}%)`);
  console.log(`Peticiones Fallidas:      ${failedRequests} (${(100 - successRate).toFixed(2)}%)`);
  console.log(`Rendimiento (RPS):        ${rps.toFixed(2)} req/s`);
  console.log(`Latencia Mínima:          ${minLatency} ms`);
  console.log(`Latencia Máxima:          ${maxLatency} ms`);
  console.log(`Latencia Promedio:        ${avgLatency.toFixed(2)} ms`);
  console.log(`Percentiles de Latencia:`);
  console.log(`  P50 (Mediana):          ${p50} ms`);
  console.log(`  P90:                    ${p90} ms`);
  console.log(`  P95:                    ${p95} ms`);
  console.log(`  P99:                    ${p99} ms`);
  console.log('\n================ Desglose por Operación ================');
  
  for (const [op, data] of Object.entries(opGroups)) {
    const opSorted = data.latencies.sort((a, b) => a - b);
    const opAvg = opSorted.reduce((s, c) => s + c, 0) / data.total;
    const opP95 = calculatePercentile(opSorted, 95);
    console.log(`- ${op}:`);
    console.log(`    Total:      ${data.total} reqs`);
    console.log(`    Éxito:      ${((data.success / data.total) * 100).toFixed(2)}%`);
    console.log(`    Avg Lat:    ${opAvg.toFixed(2)} ms`);
    console.log(`    P95 Lat:    ${opP95} ms`);
  }

  // Guardar reportes
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsDir = path.join(process.cwd(), 'test-results');
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const jsonReportPath = path.join(resultsDir, `load-test-${mode}-${concurrency}c-${timestamp}.json`);
  const mdReportPath = path.join(resultsDir, `load-test-${mode}-${concurrency}c-${timestamp}.md`);
  const summaryMdPath = path.join(resultsDir, 'load-test-summary.md');

  const reportData = {
    testParameters: {
      concurrency,
      durationSeconds,
      mode,
      timestamp: new Date().toISOString()
    },
    results: {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      rps,
      latencies: {
        min: minLatency,
        max: maxLatency,
        avg: avgLatency,
        p50,
        p90,
        p95,
        p99
      },
      operations: Object.entries(opGroups).reduce((acc, [op, data]) => {
        const sorted = data.latencies.sort((a, b) => a - b);
        acc[op] = {
          total: data.total,
          success: data.success,
          successRate: (data.success / data.total) * 100,
          avg: sorted.reduce((s, c) => s + c, 0) / data.total,
          p50: calculatePercentile(sorted, 50),
          p95: calculatePercentile(sorted, 95),
          p99: calculatePercentile(sorted, 99)
        };
        return acc;
      }, {} as Record<string, any>)
    }
  };

  fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));

  // Generar reporte en Markdown
  const markdownReport = `# Reporte de Prueba de Carga - ${new Date().toLocaleString()}

## Parámetros del Test
* **Concurrencia:** ${concurrency} workers concurrentes
* **Duración:** ${durationSeconds} segundos
* **Modo:** ${mode.toUpperCase()}
* **Backend URL:** ${supabaseUrl}

## Resumen de Rendimiento
| Métrica | Valor |
| --- | --- |
| **Total de Peticiones** | ${totalRequests} |
| **Peticiones Exitosas** | ${successfulRequests} (${successRate.toFixed(2)}%) |
| **Peticiones Fallidas** | ${failedRequests} (${(100 - successRate).toFixed(2)}%) |
| **Rendimiento (RPS)** | **${rps.toFixed(2)} req/s** |

## Distribución de Latencia
| Percentil | Latencia (ms) |
| --- | --- |
| **Mínima** | ${minLatency} ms |
| **P50 (Mediana)** | ${p50} ms |
| **Promedio** | ${avgLatency.toFixed(2)} ms |
| **P90** | ${p90} ms |
| **P95** | ${p95} ms |
| **P99** | ${p99} ms |
| **Máxima** | ${maxLatency} ms |

## Desglose por Operación
| Operación | Total | Tasa de Éxito | Latencia Promedio | Latencia P95 |
| --- | --- | --- | --- | --- |
${Object.entries(reportData.results.operations).map(([op, info]: [string, any]) => {
  return `| \`${op}\` | ${info.total} | ${info.successRate.toFixed(2)}% | ${info.avg.toFixed(2)} ms | ${info.p95} ms |`;
}).join('\n')}

---
Reporte autogenerado por el script de pruebas de carga.
`;

  fs.writeFileSync(mdReportPath, markdownReport);
  // También sobrescribimos el archivo de sumario principal
  fs.writeFileSync(summaryMdPath, markdownReport);

  console.log(`\n✅ Reporte JSON guardado en: ${jsonReportPath}`);
  console.log(`✅ Reporte Markdown guardado en: ${mdReportPath}`);
  console.log(`✅ Reporte de sumario guardado en: ${summaryMdPath}\n`);
}

runLoadTest().catch(err => {
  console.error('❌ Error crítico en ejecución del test de carga:', err);
  process.exit(1);
});
