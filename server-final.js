require('dotenv').config();
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const catalogHandler = require('./catalog/catalog-handler'); // TMDb catalog
const streamHandler = require('./stream/stream-handler');     // RaiPlay stream automatico

const manifest = {
    id: 'com.raiplay.stremio.addon',
    version: '1.6.0',
    name: 'RaiPlay Italiano',
    description: 'Catalogo TMDb + Stream RaiPlay automatici',
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

// Meta handler automatico
builder.defineMetaHandler(async (args) => {
    const title = args.extra?.name || args.id.split(':')[1] || args.id;

    return {
        meta: {
            id: title,       // lo stream handler userà il titolo per cercare su RaiPlay
            name: title,
            poster: '',
            description: ''
        }
    };
});

// Stream handler automatico
builder.defineStreamHandler(streamHandler);

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
