const { addonBuilder } = require('stremio-addon-sdk');

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

const PORT = process.env.PORT || 3000;

builder.runHTTPWithOptions({ port: PORT }, () => {
    console.log('RaiPlay Addon running on port ' + PORT);
    console.log('Manifest: http://localhost:' + PORT + '/manifest.json');
});
