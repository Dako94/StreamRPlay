const axios = require('axios');

module.exports = async function videoExtractor(id) {
    try {
        // URL JSON del video RaiPlay
        const url = `https://www.raiplay.it/video/${id}.html?json`;

        const res = await axios.get(url);
        const data = res.data;

        // Controllo se ci sono video disponibili
        if (!data.video || !data.video.sources) {
            return [];
        }

        // Filtra solo i link m3u8 o mpd
        const streams = data.video.sources
            .filter(source => source.url?.endsWith('.m3u8') || source.url?.endsWith('.mpd'))
            .map(source => ({
                title: data.video.title || 'RaiPlay Stream',
                url: source.url,
                isFree: true
            }));

        return streams;

    } catch (err) {
        console.error('Errore video-extractor:', err);
        return [];
    }
};
