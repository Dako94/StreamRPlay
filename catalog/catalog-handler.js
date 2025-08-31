require('dotenv').config();
const fetch = require('node-fetch');
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) throw new Error('Devi impostare TMDB_API_KEY nel file .env!');

module.exports = async function catalogHandler(args) {
    try {
        const type = args.type === 'movie' ? 'movie' : 'tv';
        const query = args.extra?.search || '';
        const url = query
            ? `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=it-IT`
            : `https://api.themoviedb.org/3/${type}/popular?api_key=${TMDB_API_KEY}&language=it-IT&page=1`;

        const res = await fetch(url);
        const data = await res.json();

        const items = data.results || [];
        const metas = items.map(item => ({
            id: `${type}:${item.id}`,
            type: type,
            name: item.title || item.name,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
            description: item.overview || '',
            genres: [] // opzionale, puoi mappare da item.genre_ids
        }));

        return { metas };
    } catch (err) {
        console.error('Errore catalogo TMDb:', err);
        return { metas: [] };
    }
};
