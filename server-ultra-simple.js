const { addonBuilder } = require('stremio-addon-sdk');

// Manifest
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
            name: 'Serie TV RaiPlay'
        },
        {
            type: 'movie', 
            id: 'raiplay_movies',
            name: 'Film RaiPlay'
        }
    ]
};

// Crea builder
const builder = new addonBuilder(manifest);

// Handler catalogo
builder.defineCatalogHandler(async (args) => {
    console.log('📺 Catalog request:', args);
    
    try {
        // Dati di esempio
        const metas = [
            {
                id: 'raiplay:montalbano',
                type: args.type,
                name: 'Il Commissario Montalbano',
                poster: 'https://via.placeholder.com/300x450/4CAF50/white?text=Montalbano',
                genres: ['Crime', 'Drama'],
                description: 'Le avventure del commissario Montalbano',
                year: 2021
            },
            {
                id: 'raiplay:doc', 
                type: args.type,
                name: 'Doc - Nelle tue mani',
                poster: 'https://via.placeholder.com/300x450/2196F3/white?text=Doc',
                genres: ['Drama', 'Medical'],
                description: 'Serie TV medica italiana',
                year: 2020
            },
            {
                id: 'raiplay:mina',
                type: args.type,  
                name: 'Mina Settembre',
                poster: 'https://via.placeholder.com/300x450/FF9800/white?text=Mina',
                genres: ['Drama'],
                description: 'Le avventure di una assistente sociale a Napoli',
                year: 2021
            }
        ];

        return { 
            metas: metas.slice(0, 20), // Limita a 20
            cacheMaxAge: 3600 // Cache 1 ora
        };
    } catch (error) {
        console.error('❌ Catalog error:', error);
        return { metas: [] };
    }
});

// Handler stream
builder.defineStreamHandler(async (args) => {
    console.log('🎬 Stream request:', args);
    
    try {
        // Stream di test basati sull'ID
        const streams = [];
        
        if (args.id.includes('montalbano')) {
            streams.push({
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                title: 'Il Commissario Montalbano - Episodio Test',
                behaviorHints: {
                    notWebReady: true,
                    bingeGroup: 'montalbano'
                }
            });
        } else if (args.id.includes('doc')) {
            streams.push({
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                title: 'Doc - Nelle tue mani - Episodio Test',
                behaviorHints: {
                    notWebReady: true,
                    bingeGroup: 'doc'
                }
            });
        } else {
            // Stream generico
            streams.push({
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                title: 'RaiPlay Stream (Test)',
                behaviorHints: {
                    notWebReady: true
                }
            });
        }

        return { 
            streams: streams,
            cacheMaxAge: 300 // Cache 5 minuti
        };
    } catch (error) {
        console.error('❌ Stream error:', error);
        return { streams: [] };
    }
});

// Usa il server HTTP integrato dell'SDK
const PORT = process.env.PORT || 3000;

builder.runHTTPWithOptions({ port: PORT }, () => {
    console.log(`🚀 RaiPlay Addon running on port ${PORT}`);
    console.log(`📺 Manifest URL: http://localhost:${PORT}/manifest.json`);
    console.log(`🔍 Test catalog: http://localhost:${PORT}/catalog/series/raiplay_series.json`);
    console.log(`🎬 Test stream: http://localhost:${PORT}/stream/series/raiplay:montalbano.json`);
    console.log(`🏥 Add to Stremio: http://localhost:${PORT}/manifest.json`);
});

// Gestione segnali di chiusura
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');  
    process.exit(0);
});

console.log('🎭 RaiPlay Addon initializing...');
console.log('📋 Manifest:', JSON.stringify(manifest, null, 2));        uptime: process.uptime()
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
