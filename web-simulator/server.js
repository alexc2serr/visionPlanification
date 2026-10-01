const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HTML_FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
    fs.readFile(HTML_FILE, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error cargando simulador web.');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 ========================================================`);
    console.log(`✨ Simulador Web de VisionPlanification activo:`);
    console.log(`👉 Abre tu navegador en: http://localhost:${PORT}`);
    console.log(`📸 Usa tu cámara web real o simulación automática con Stitch HUD.`);
    console.log(`========================================================\n`);
});
