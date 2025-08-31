const axios = require('axios');

module.exports = async function videoExtractor(id) {
    try {
        const url = `https://www.raiplay.it/video/${id}.html?json`;

        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        });
        const data = res.data;

        if (!data.video || !data.video.sources) return [];

        const streams = data.video.sources
            .filter(s => s.url?.endsWith('.m3u8') || s.url?.endsWith('.mpd'))
            .map(s => ({
                title: data.video.title || 'RaiPlay Stream',
                url: s.url,
                isFree: true
            }));

        return streams;
    } catch (err) {
        console.error('Errore video-extractor:', err);
        return [];
    }
};
