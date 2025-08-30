const { addonBuilder } = require('stremio-addon-sdk');
const express = require('express');
const cors = require('cors');

// Manifest semplificato
const manifest = {
    id: 'com.raiplay.stremio.addon',
    version: '1.2.0',
    name: 'RaiPlay Italiano',
    description: 'Accedi a tutti i contenuti RaiPlay direttamente su Stremio',
    logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_rai-play.png',
    
    resources: ['catalog', 'stream'],
    types: ['movie', 'series'],
    
    catalogs: [
        {
            type: 'series',
            id: 'raiplay_series',
            name: 'Serie TV RaiPlay',
            extra: [{ name: 'skip', options: ['0'] }]
        },
        {
            type: 'movie', 
            id: 'raiplay_movies',
            name: 'Film RaiPlay',
            extra: [{ name: 'skip', options: ['0'] }]
        }
    ]
};

// Crea builder
const builder = new addonBuilder(manifest);

// Handler catalogo semplificato
builder.defineCatalogHandler(async (args) => {
    console.log('Catalog request:', args);
    
    try {
        // Dati di esempio per ora
        const metas = [
            {
                id: 'raiplay:test1',
                type: args.type,
                name: 'Il Commissario Montalbano',
                poster: 'https://www.raiplay.it/cropgd/640x360/dl/images/2021/03/1615891603946_montalbano.jpg',
                genres: ['Crime', 'Drama'],
                description: 'Le avventure del commissario Montalbano'
            },
            {
                id: 'raiplay:test2', 
                type: args.type,
                name: 'Doc - Nelle tue mani',
                poster: 'https://www.raiplay.it/cropgd/640x360/dl/images/2021/03/1615891603947_doc.jpg',
                genres: ['Drama', 'Medical'],
                description: 'Serie TV medica italiana'
            }
        ];

        return { metas };
    } catch (error) {
        console.error('Catalog error:', error);
        return { metas: [] };
    }
});

// Handler stream semplificato
builder.defineStreamHandler(async (args) => {
    console.log('Stream request:', args);
    
    try {
        // Per ora restituiamo un stream di test
        const streams = [
            {
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                title: 'RaiPlay Stream (Test)',
                behaviorHints: {
                    notWebReady: true
                }
            }
        ];

        return { streams };
    } catch (error) {
        console.error('Stream error:', error);
        return { streams: [] };
    }
});

// Configurazione server Express
const app = express();

// CORS semplice
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging semplice
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Mount dell'addon
app.use('/', builder.getInterface());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Test route
app.get('/test', (req, res) => {
    res.json({
        message: 'RaiPlay Addon funzionante!',
        manifest: manifest
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Avvio server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`🚀 RaiPlay Addon running on ${HOST}:${PORT}`);
    console.log(`📺 Manifest URL: http://${HOST}:${PORT}/manifest.json`);
    console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
