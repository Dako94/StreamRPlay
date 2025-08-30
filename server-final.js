const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const catalogHandler = require('./catalog-handler');   // il tuo handler dinamico
const streamHandler = require('./stream-handler');     // il tuo handler dinamico

// Manifest dell'addon
const manifest = {
    id: 'com.raiplay.stremio.addon',
    version: '1.2.0',
    name: 'RaiPlay Italiano',
    description: 'Accedi a tutti i contenuti RaiPlay direttamente su Stremio',
    logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_rai-play.png',
    resources: ['catalog', 'stream', 'meta'],
    types: ['movie', 'tv'],
    catalogs: [
        { type: 'tv', id: 'raiplay_series', name: 'Serie TV RaiPlay' },
        { type: 'movie', id: 'raiplay_movies', name: 'Film RaiPlay' }
    ]
};

const builder = new addonBuilder(manifest);

// Usa gli handler dinamici
builder.defineCatalogHandler(catalogHandler);
builder.defineStreamHandler(streamHandler);

// Porta del server
const PORT = process.env.PORT || 3000;

// ServeHTTP se disponibile
if (serveHTTP) {
    serveHTTP(builder.getInterface(), { port: PORT });
} else {
    const express = require('express');
    const app = express();

    // Usa direttamente l'interfaccia dell'addon
    app.use(builder.getInterface());

    app.listen(PORT, () => {
        console.log('RaiPlay Addon running on port ' + PORT);
        console.log('Manifest URL: http://localhost:' + PORT + '/manifest.json');
    });
}

console.log('RaiPlay Addon starting on port ' + PORT);
console.log('Manifest URL: http://localhost:' + PORT + '/manifest.json');
