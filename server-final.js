const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const catalogHandler = require('./catalog/catalog-handler');
const streamHandler = require('./stream/stream-handler');

const manifest = {
    id: 'com.raiplay.stremio.addon',
    version: '1.2.0',
    name: 'RaiPlay Italiano',
    description: 'Accedi a tutti i contenuti RaiPlay direttamente su Stremio',
    logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_rai-play.png',
    resources: ['catalog', 'stream'],  // non serve 'meta' qui
    types: ['movie', 'series'],
    catalogs: [
        { type: 'series', id: 'raiplay_series', name: 'Serie TV RaiPlay' },
        { type: 'movie', id: 'raiplay_movies', name: 'Film RaiPlay' }
    ]
};

const builder = new addonBuilder(manifest);

// Catalogo dinamico
builder.defineCatalogHandler(catalogHandler);

// Stream dinamico
builder.defineStreamHandler(streamHandler);

// Meta handler minimo per evitare errori Stremio
builder.defineMetaHandler(async (args) => {
    return {
        meta: {
            id: args.id,
            name: args.id
        }
    };
});

const PORT = process.env.PORT || 3000;

// ServeHTTP se disponibile
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
