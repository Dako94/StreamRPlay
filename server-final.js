const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

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

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async (args) => {
    console.log('Catalog request:', args);
    
    const metas = [
        {
            id: 'raiplay:montalbano',
            type: args.type,
            name: 'Il Commissario Montalbano',
            poster: 'https://via.placeholder.com/300x450/4CAF50/white?text=Montalbano',
            genres: ['Crime', 'Drama']
        },
        {
            id: 'raiplay:doc', 
            type: args.type,
            name: 'Doc - Nelle tue mani',
            poster: 'https://via.placeholder.com/300x450/2196F3/white?text=Doc',
            genres: ['Drama']
        }
    ];

    return { metas: metas };
});

builder.defineStreamHandler(async (args) => {
    console.log('Stream request:', args);
    
    const streams = [
        {
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            title: 'RaiPlay Test Stream'
        }
    ];

    return { streams: streams };
});

// Usa serveHTTP se disponibile
const PORT = process.env.PORT || 3000;

if (serveHTTP) {
    serveHTTP(builder.getInterface(), { port: PORT });
} else {
    // Fallback con server custom
    const express = require('express');
    const app = express();
    
    const addonInterface = builder.getInterface();
    
    app.get('/manifest.json', addonInterface.get || ((req, res) => res.json(manifest)));
    app.get('/catalog/:type/:id.json', addonInterface.get || ((req, res) => res.json({ metas: [] })));
    app.get('/stream/:type/:id.json', addonInterface.get || ((req, res) => res.json({ streams: [] })));
    
    app.listen(PORT, () => {
        console.log('RaiPlay Addon running on port ' + PORT);
    });
}

console.log('RaiPlay Addon starting on port ' + PORT);
console.log('Manifest URL: http://localhost:' + PORT + '/manifest.json');
