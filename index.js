const { addonBuilder } = require('stremio-addon-sdk');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

// Configurazione dell'addon
const manifest = {
    id: 'com.raiplay.addon',
    version: '1.0.0',
    name: 'RaiPlay Addon',
    description: 'Addon per accedere ai contenuti di RaiPlay su Stremio',
    logo: 'https://www.rai.it/dl/RaiTV/2014/PublishingBlock-9b792d8f-cc4b-4ce3-9780-9ff941db0a59.png',
    resources: ['catalog', 'stream'],
    types: ['movie', 'series'],
    catalogs: [
        {
            type: 'series',
            id: 'raiplay-series',
            name: 'Serie TV RaiPlay',
            extra: [
                { name: 'genre', options: ['drama', 'comedy', 'documentary', 'kids'] },
                { name: 'skip', options: ['0'] }
            ]
        },
        {
            type: 'movie',
            id: 'raiplay-movies',
            name: 'Film RaiPlay',
            extra: [
                { name: 'genre', options: ['drama', 'comedy', 'documentary'] },
                { name: 'skip', options: ['0'] }
            ]
        }
    ]
};

const builder = new addonBuilder(manifest);

// Headers per le richieste a RaiPlay
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
    'Referer': 'https://www.raiplay.it/'
};

// Funzione per ottenere il catalogo da RaiPlay
async function getRaiPlayCatalog(type = 'series', skip = 0, limit = 20) {
    try {
        // URL dell'API di RaiPlay (questi potrebbero cambiare)
        const apiUrl = type === 'series' 
            ? 'https://www.raiplay.it/api/recommends?type=SeriesContainer'
            : 'https://www.raiplay.it/api/recommends?type=MovieContainer';
        
        const response = await axios.get(apiUrl, { headers });
        const data = response.data;
        
        const metas = [];
        
        if (data && data.blocks) {
            for (const block of data.blocks) {
                if (block.sets) {
                    for (const set of block.sets) {
                        if (set.items) {
                            for (const item of set.items.slice(skip, skip + limit)) {
                                if (item.PlaylistItem) {
                                    const playlistItem = item.PlaylistItem;
                                    
                                    const meta = {
                                        id: `raiplay:${playlistItem.id}`,
                                        type: type,
                                        name: playlistItem.name || playlistItem.title,
                                        poster: playlistItem.images?.[0]?.url || playlistItem.image,
                                        background: playlistItem.images?.[1]?.url,
                                        description: playlistItem.description,
                                        genres: playlistItem.genres || [],
                                        year: playlistItem.year,
                                        imdbRating: playlistItem.rating
                                    };
                                    
                                    metas.push(meta);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return metas;
    } catch (error) {
        console.error('Errore nel recupero del catalogo RaiPlay:', error.message);
        return [];
    }
}

// Funzione per estrarre l'URL del video
async function getVideoStream(raiplayId) {
    try {
        // Rimuove il prefisso 'raiplay:' dall'ID
        const cleanId = raiplayId.replace('raiplay:', '');
        
        // URL della pagina del contenuto
        const pageUrl = `https://www.raiplay.it/video/${cleanId}`;
        
        // Ottiene la pagina HTML
        const response = await axios.get(pageUrl, { headers });
        const $ = cheerio.load(response.data);
        
        // Cerca i dati del video nello script JSON
        let videoData = null;
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const jsonData = JSON.parse($(el).html());
                if (jsonData.contentUrl || jsonData.embedUrl) {
                    videoData = jsonData;
                }
            } catch (e) {
                // Continua la ricerca
            }
        });
        
        // Cerca anche nei tag script per i dati React/Next.js
        $('script').each((i, el) => {
            const scriptContent = $(el).html();
            if (scriptContent && scriptContent.includes('mediaUri')) {
                try {
                    const match = scriptContent.match(/"mediaUri":"([^"]+)"/);
                    if (match) {
                        videoData = { contentUrl: match[1] };
                    }
                } catch (e) {
                    // Continua la ricerca
                }
            }
        });
        
        if (videoData && videoData.contentUrl) {
            return [{
                url: videoData.contentUrl,
                title: 'RaiPlay Stream',
                behaviorHints: {
                    notWebReady: true
                }
            }];
        }
        
        // Fallback: cerca link M3U8 direttamente
        const m3u8Match = response.data.match(/https:\/\/[^"]*\.m3u8[^"]*/);
        if (m3u8Match) {
            return [{
                url: m3u8Match[0],
                title: 'RaiPlay HLS Stream',
                behaviorHints: {
                    notWebReady: true
                }
            }];
        }
        
        return [];
        
    } catch (error) {
        console.error('Errore nell\'estrazione del flusso video:', error.message);
        return [];
    }
}

// Handler per i cataloghi
builder.defineCatalogHandler(async (args) => {
    console.log('Richiesta catalogo:', args);
    
    const { type, id, extra = {} } = args;
    const skip = parseInt(extra.skip) || 0;
    
    if (id === 'raiplay-series' || id === 'raiplay-movies') {
        const catalogType = id === 'raiplay-series' ? 'series' : 'movie';
        const metas = await getRaiPlayCatalog(catalogType, skip);
        
        return {
            metas: metas,
            cacheMaxAge: 3600 // Cache per 1 ora
        };
    }
    
    return { metas: [] };
});

// Handler per gli stream
builder.defineStreamHandler(async (args) => {
    console.log('Richiesta stream:', args);
    
    const { type, id } = args;
    
    if (id.startsWith('raiplay:')) {
        const streams = await getVideoStream(id);
        
        return {
            streams: streams,
            cacheMaxAge: 300 // Cache per 5 minuti
        };
    }
    
    return { streams: [] };
});

// Configurazione del server Express
const app = express();
app.use(cors());

// Middleware per il logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Monta l'addon
app.use('/', builder.getInterface());

// Route di test
app.get('/test', (req, res) => {
    res.json({ 
        message: 'RaiPlay Addon funzionante!',
        manifest: manifest 
    });
});

// Gestione errori
app.use((err, req, res, next) => {
    console.error('Errore:', err);
    res.status(500).json({ error: 'Errore interno del server' });
});

// Avvio del server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`RaiPlay Addon in esecuzione su porta ${PORT}`);
    console.log(`Manifest URL: http://localhost:${PORT}/manifest.json`);
    console.log(`Aggiungi questo URL a Stremio: http://localhost:${PORT}/manifest.json`);
});

module.exports = app;