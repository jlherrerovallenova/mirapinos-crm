import puppeteer from 'puppeteer';

(async () => {
    console.log('Iniciando Puppeteer para monitorear peticiones...');
    const browser = await puppeteer.launch({
        headless: 'new', // Or true for old headless
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    let requestCount = 0;
    const urlCounts = new Map();

    page.on('request', request => {
        const url = request.url();
        if (url.includes('supabase.co')) {
            requestCount++;
            const currentCount = urlCounts.get(url) || 0;
            urlCounts.set(url, currentCount + 1);

            console.log(`[REQ #${requestCount}] ${request.method()} ${url}`);

            if (currentCount > 50) {
                console.error(`\n🚨 ¡ALERTA! Bucle infinito detectado en: ${url}\n`);
                // Dump and exit
                console.log('Resumen de peticiones a Supabase:');
                for (const [key, value] of urlCounts.entries()) {
                    console.log(`- ${value} peticiones: ${key}`);
                }
                process.exit(1);
            }
        }
    });

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[AuthDebug]') || text.includes('GLOBAL FETCH MOCK') || msg.type() === 'error' || msg.type() === 'warning') {
            console.log(`[Navegador ${msg.type().toUpperCase()}] ${text}`);
        }
    });

    try {
        console.log('Navegando a la aplicación local...');
        // Ojo al puerto que Vite haya asignado (ej. 5173 o 5174)
        await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });

        console.log('Página cargada. Esperando 30 segundos observando tráfico...');
        await new Promise(r => setTimeout(r, 30000));

        console.log('Resumen final de peticiones a Supabase (sin bucle detectado):');
        for (const [key, value] of urlCounts.entries()) {
            console.log(`- ${value} peticiones: ${key}`);
        }

    } catch (e) {
        console.error('Error durante la navegación:', e);
    } finally {
        await browser.close();
        process.exit(0);
    }
})();
