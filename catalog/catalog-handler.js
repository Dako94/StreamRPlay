const fetch = require('node-fetch');
const genreMapper = require('./genre-mapper');

module.exports = async function catalogHandler(args) {
    try {
        // Se l’utente cerca qualcosa, usiamo search, altrimenti prendiamo tutto
        const searchQuery = args.extra?.search || '';
        const url = `https://www.raiplay.it/ricerca?json&q=${encodeURIComponent(searchQuery)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.results || !Array.isArray(data.results)) return { metas: [] };

        // Mappiamo i risultati nel formato Stremio
        const metas = data.results
            .map(item => ({
                id: item.id,
                type: item.category === 'Serie TV' ? 'series' : 'movie',
                name: item.title,
                poster: item.image || '',
                description: item.description || '',
                genres: genreMapper(item.category)
            }))
            .filter(meta => meta.type === args.type);

        return { metas };
    } catch (err) {
        console.error('Errore catalogo RaiPlay:', err);
        return { metas: [] };
    }
};
