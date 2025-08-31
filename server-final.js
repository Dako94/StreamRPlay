require('dotenv').config();
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const catalogHandler = require('./catalog/catalog-handler'); // TMDb catalog
const videoExtractor = require('./stream/video-extractor');

const manifest = {
    id: 'com.raiplay.stremio.addon',
    version: '1.5.0',
    name: 'RaiPlay Italiano',
    description: 'Catalogo TMDb + Stream RaiPlay',
    logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_rai-play.png',
    resources: ['catalog', 'stream', 'meta'],
    types: ['movie', 'series'],
    catalogs: [
        { type: 'series', id: 'tmdb_series', name: 'Serie TV TMDb' },
        { type: 'movie', id: 'tmdb_movies', name: 'Film TMDb' }
    ]
};

const builder = new addonBuilder(manifest);

// Catalogo TMDb
builder.defineCatalogHandler(catalogHandler);

// Meta handler: mappa ID TMDb → ID RaiPlay
builder.defineMetaHandler(async (args) => {
    // args.id = "movie:1234" oppure "series:5678"
    const [type, tmdbId] = args.id.split(':');

    // Per test → ID di un video reale di RaiPlay
    // In futuro puoi creare un mapping TMDbID → RaiPlayID
    const raiplayId = '2011/01/pocoyo-s1e1-hush-xxxxxx';

    return {
        meta: {
            id: raiplayId,          // Stremio userà questo ID per stream handler
            name: `Test video ${tmdbId}`,
            poster: '',              // opzionale
            description: 'Descrizione test',  // opzionale
        }
    };
});

// Stream handler: prende ID dal meta handler e restituisce flussi RaiPlay
builder.defineStreamHandler(async (args) => {
    try {
        const streams = await videoExtractor(args.id);
        return { streams };
    } catch (err) {
        console.error('Errore stream handler:', err);
        return { streams: [] };
    }
});

const PORT = process.env.PORT || 3000;

if (serveHTTP) {
    serveHTTP(builder.getInterface(), { port: PORT });
} else {
    const express = require('express');
    const app = express();
    app.use(builder.getInterface());
    app.listen(PORT, () => {
        console.log('RaiPlay Addon running on port ' + PORT);
        console.log('Manifest URL: http://localhost:' + PORT + '/manifest.json');
    });
}

console.log('RaiPlay Addon starting on port ' + PORT);
console.log('Manifest URL: http://localhost:' + PORT + '/manifest.json');
