const axios = require('axios');

module.exports = async function streamHandler(args) {
    try {
        const title = args.id; // viene dal meta handler

        const searchUrl = `https://www.raiplay.it/ricerca?json&q=${encodeURIComponent(title)}`;
        const res = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
                'Referer': 'https://www.raiplay.it/'
            }
        });

        const results = res.data.results || [];

        if (!results.length) return { streams: [] };

        const videoId = results[0].video?.id || results[0].id;
        if (!videoId) return { streams: [] };

        const videoJsonUrl = `https://www.raiplay.it/video/${videoId}.html?json`;
        const videoRes = await axios.get(videoJsonUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
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
