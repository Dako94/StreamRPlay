const axios = require('axios');

module.exports = async function streamHandler(args) {
    try {
        // args.id = "movie:1234" o "series:5678"
        const title = args.extra?.name || args.id.split(':')[1];

        // Cerca su RaiPlay usando API JSON
        const searchUrl = `https://www.raiplay.it/ricerca?json&q=${encodeURIComponent(title)}`;
        const res = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json',
                'Referer': 'https://www.raiplay.it/'
            }
        });

        const results = res.data.results || [];

        if (!results.length) {
            return { streams: [] }; // nessun video trovato
        }

        // Prendiamo il primo risultato
        const videoId = results[0].video?.id || results[0].id;
        if (!videoId) return { streams: [] };

        // Ottieni il JSON del video per estrarre flusso .m3u8
        const videoJsonUrl = `https://www.raiplay.it/video/${videoId}.html?json`;
        const videoRes = await axios.get(videoJsonUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json',
                'Referer': 'https://www.raiplay.it/'
            }
        });

        const videoData = videoRes.data;
        const streams = [];

        if (videoData.video?.url?.hls) {
            streams.push({
                title: videoData.video.title || title,
                url: videoData.video.url.hls,
                type: 'm3u8'
            });
        }

        return { streams };
    } catch (err) {
        console.error('Errore stream handler automatico:', err);
        return { streams: [] };
    }
};
