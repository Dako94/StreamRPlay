const axios = require('axios');
require('dotenv').config();

const RAI_EMAIL = process.env.RAI_EMAIL;
const RAI_PASSWORD = process.env.RAI_PASSWORD;

if (!RAI_EMAIL || !RAI_PASSWORD) throw new Error('Devi impostare RAI_EMAIL e RAI_PASSWORD nel file .env!');

let cookies = null;

// Funzione per fare login su RaiPlay e ottenere cookie
async function loginRaiPlay() {
    if (cookies) return cookies;

    const loginUrl = 'https://www.raiplay.it/login';
    // POST dati login
    const res = await axios.post(loginUrl, {
        email: RAI_EMAIL,
        password: RAI_PASSWORD
    }, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        maxRedirects: 0,
        validateStatus: null
    });

    if (!res.headers['set-cookie']) throw new Error('Login fallito! Controlla credenziali RaiPlay');
    cookies = res.headers['set-cookie'].join('; ');
    return cookies;
}

module.exports = async function streamHandler(args) {
    try {
        const title = args.id;

        // Login automatico
        const cookieHeader = await loginRaiPlay();

        // Cerca su RaiPlay
        const searchUrl = `https://www.raiplay.it/ricerca?json&q=${encodeURIComponent(title)}`;
        const res = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
                'Referer': 'https://www.raiplay.it/',
                'Cookie': cookieHeader
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
                'Referer': 'https://www.raiplay.it/',
                'Cookie': cookieHeader
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
