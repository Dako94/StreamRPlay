const fetch = require('node-fetch');
const genreMapper = require('./genre-mapper'); // Assicurati che il percorso sia corretto

// Catalog handler dinamico
module.exports = async function catalogHandler(args) {
    const searchQuery = args.extra && args.extra.search ? args.extra.search : '';

    const url = `https://www.raiplay.it/ricerca?json&q=${encodeURIComponent(searchQuery)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.results || !Array.isArray(data.results)) {
            return { metas: [] };
        }

        // Mappa i risultati in formato Stremio
        const metas = data.results.map(item => ({
            id: item.id,
            type: item.category === 'Serie TV' ? 'tv' : 'movie',
            name: item.title,
            poster: item.image || '',
            description: item.description || '',
            genres: genreMapper(item.category)
        })).filter(meta => meta.type === args.type);

        return { metas };
    } catch (err) {
        console.error('Errore catalogo RaiPlay:', err);
        return { metas: [] };
    }
};
