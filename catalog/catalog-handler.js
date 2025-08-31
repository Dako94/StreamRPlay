const fetch = require('node-fetch');
const genreMapper = require('./genre-mapper');

module.exports = async function catalogHandler(args) {
    try {
        const searchQuery = args.extra?.search || '';
        const url = `https://www.raiplay.it/ricerca?json&q=${encodeURIComponent(searchQuery)}`;

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            }
        });
        const data = await res.json();

        console.log('DEBUG catalog data:', JSON.stringify(data, null, 2));

        // Alcuni JSON hanno `results`, altri `items`
        const items = data.results || data.items || [];

        const metas = items
            .map(item => {
                // ID corretto per video-extractor
                const id = item.url?.split('/video/')[1]?.replace('.html', '') || item.id;

                return {
                    id: id,
                    type: item.category === 'Serie TV' ? 'series' : 'movie',
                    name: item.title || '',
                    poster: item.image || '',
                    description: item.description || '',
                    genres: genreMapper(item.category)
                };
            })
            .filter(meta => meta.type === args.type);

        return { metas };
    } catch (err) {
        console.error('Errore catalogo RaiPlay:', err);
        return { metas: [] };
    }
};
