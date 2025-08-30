const { addonBuilder } = require("stremio-addon-sdk");
const fetch = require("node-fetch");

const manifest = {
    id: "org.raiplay",
    version: "1.0.0",
    name: "RaiPlay Addon",
    resources: ["catalog", "meta"],
    types: ["tv", "movie"],
    catalogs: [
        { type: "tv", id: "raiplay_tv", name: "RaiPlay Serie TV" },
        { type: "movie", id: "raiplay_movie", name: "RaiPlay Film" }
    ]
};

const builder = new addonBuilder(manifest);

// Catalogo
builder.defineCatalogHandler(async ({ type, id, extra }) => {
    const searchQuery = extra && extra.search ? extra.search : "";
    const url = `https://www.raiplay.it/ricerca?json&q=${encodeURIComponent(searchQuery)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        const metas = data.results
            .filter(item => (type === "tv" ? item.category === "Serie TV" : item.category !== "Serie TV"))
            .map(item => ({
                id: item.id,
                type: item.category === "Serie TV" ? "tv" : "movie",
                name: item.title,
                poster: item.image || "",
                description: item.description || ""
            }));

        return { metas };
    } catch (err) {
        console.error("Errore catalogo RaiPlay:", err);
        return { metas: [] };
    }
});

// Meta dettagli (stagioni e episodi)
builder.defineMetaHandler(async ({ type, id }) => {
    try {
        const jsonUrl = `https://www.raiplay.it/video/${id}.html?json`;
        const res = await fetch(jsonUrl);
        const data = await res.json();

        if (type === "tv" && data && data.video && data.video.episodes) {
            const seasons = {};
            data.video.episodes.forEach(ep => {
                const seasonNum = ep.season || 1;
                if (!seasons[seasonNum]) seasons[seasonNum] = [];
                seasons[seasonNum].push({
                    id: ep.id,
                    name: ep.title,
                    episode: ep.episode || 1,
                    season: seasonNum,
                    poster: ep.image || "",
                    description: ep.description || ""
                });
            });

            const streams = Object.keys(seasons).map(season => ({
                season: parseInt(season),
                episodes: seasons[season]
            }));

            return {
                meta: {
                    id,
                    type: "tv",
                    name: data.video.title,
                    poster: data.video.image || "",
                    description: data.video.description || "",
                    streams
                }
            };
        } else {
            return {
                meta: {
                    id,
                    type: "movie",
                    name: data.video.title,
                    poster: data.video.image || "",
                    description: data.video.description || ""
                }
            };
        }
    } catch (err) {
        console.error("Errore meta RaiPlay:", err);
        return { meta: null };
    }
});

module.exports = builder.getInterface();        } catch (error) {
            logger.error(`Errore nel recupero fiction RAI: ${error.message}`);
            return [];
        }
    }

    // Film del cinema
    async getCinemaMovies(extra = {}) {
        const url = `${this.baseUrl}/cinema`;
        return await this.scrapeMoviesFromPage(url, extra);
    }

    // Film per la TV
    async getTvMovies(extra = {}) {
        const url = `${this.baseUrl}/film-per-la-tv`;
        return await this.scrapeMoviesFromPage(url, extra);
    }

    // Documentari
    async getDocumentaries(extra = {}) {
        const url = `${this.baseUrl}/documentari`;
        return await this.scrapeMoviesFromPage(url, extra, 'movie');
    }

    // Programmi di intrattenimento
    async getEntertainmentShows(extra = {}) {
        const url = `${this.baseUrl}/intrattenimento`;
        return await this.scrapeShowsFromPage(url, extra);
    }

    // Programmi per bambini
    async getKidsShows(extra = {}) {
        const url = `${this.baseUrl}/bambini`;
        return await this.scrapeShowsFromPage(url, extra);
    }

    // Programmi culturali
    async getCulturalShows(extra = {}) {
        const url = `${this.baseUrl}/cultura`;
        return await this.scrapeShowsFromPage(url, extra);
    }

    // Canali live
    async getLiveChannels(extra = {}) {
        try {
            const channels = [
                { id: 'raiplay:live:rai1', name: 'Rai 1', logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_rai1.png' },
                { id: 'raiplay:live:rai2', name: 'Rai 2', logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_rai2.png' },
                { id: 'raiplay:live:rai3', name: 'Rai 3', logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_rai3.png' },
                { id: 'raiplay:live:rai4', name: 'Rai 4', logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_rai4.png' },
                { id: 'raiplay:live:rai5', name: 'Rai 5', logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_rai5.png' },
                { id: 'raiplay:live:raimovie', name: 'Rai Movie', logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_raimovie.png' },
                { id: 'raiplay:live:raipremium', name: 'Rai Premium', logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_raipremium.png' },
                { id: 'raiplay:live:raiyoyo', name: 'Rai YoYo', logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_raiyoyo.png' },
                { id: 'raiplay:live:raigulp', name: 'Rai Gulp', logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_raigulp.png' }
            ];

            return channels.map(channel => ({
                id: channel.id,
                type: 'channel',
                name: channel.name,
                poster: channel.logo,
                genres: ['Live TV']
            }));
        } catch (error) {
            logger.error(`Errore nel recupero canali live: ${error.message}`);
            return [];
        }
    }

    // Utility functions

    // Scraping generico per film
    async scrapeMoviesFromPage(url, extra = {}, type = 'movie') {
        const skip = parseInt(extra.skip) || 0;
        
        try {
            const response = await axios.get(url, {
                headers: auth.getAuthenticatedHeaders(),
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const metas = [];

            $('.slider-item, .card-container, .content-item, .movie-card').each((i, element) => {
                if (i < skip) return;
                if (metas.length >= 20) return;

                const $el = $(element);
                const link = $el.find('a').first().attr('href');
                const title = $el.find('h3, .title, .card-title, .movie-title').first().text().trim();
                const image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
                const description = $el.find('.description, .card-text, p').first().text().trim();
                const year = this.extractYearFromText(title + ' ' + description);

                if (link && title) {
                    const id = this.extractIdFromUrl(link);
                    if (id) {
                        metas.push({
                            id: `raiplay:${id}`,
                            type: type,
                            name: title,
                            poster: this.normalizeImageUrl(image),
                            description: description || '',
                            year: year,
                            genres: genreMapper.extractGenresFromText(title + ' ' + description)
                        });
                    }
                }
            });

            return metas;
        } catch (error) {
            logger.error(`Errore nello scraping da ${url}: ${error.message}`);
            return [];
        }
    }

    // Scraping generico per show/programmi
    async scrapeShowsFromPage(url, extra = {}) {
        return await this.scrapeMoviesFromPage(url, extra, 'series');
    }

    // Parse raccomandazioni API
    parseRecommendations(data, type, skip = 0) {
        const metas = [];
        
        try {
            if (data && data.blocks) {
                for (const block of data.blocks) {
                    if (block.sets) {
                        for (const set of block.sets) {
                            if (set.items) {
                                for (const item of set.items.slice(skip, skip + 20)) {
                                    if (item.PlaylistItem) {
                                        const playlistItem = item.PlaylistItem;
                                        
                                        metas.push({
                                            id: `raiplay:${playlistItem.id}`,
                                            type: type,
                                            name: playlistItem.name || playlistItem.title,
                                            poster: this.normalizeImageUrl(playlistItem.images?.[0]?.url || playlistItem.image),
                                            background: this.normalizeImageUrl(playlistItem.images?.[1]?.url),
                                            description: playlistItem.description || '',
                                            genres: playlistItem.genres || [],
                                            year: playlistItem.year,
                                            imdbRating: playlistItem.rating
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            logger.error(`Errore nel parsing raccomandazioni: ${error.message}`);
        }
        
        return metas;
    }

    // Utility per estrarre ID dall'URL
    extractIdFromUrl(url) {
        if (!url) return null;
        
        // Pattern per diversi tipi di URL RaiPlay
        const patterns = [
            /\/video\/(.+?)(?:\?|$)/,
            /\/programmi\/(.+?)(?:\?|$)/,
            /\/fiction\/(.+?)(?:\?|$)/,
            /\/film\/(.+?)(?:\?|$)/,
            /\/dirette\/(.+?)(?:\?|$)/,
            /raiplay\.it\/(.+?)(?:\?|$)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1].replace(/\/$/, ''); // Rimuovi slash finale
            }
        }
        
        return null;
    }

    // Normalizza URL delle immagini
    normalizeImageUrl(imageUrl) {
        if (!imageUrl) return null;
        
        // Se l'URL è relativo, aggiunge il dominio
        if (imageUrl.startsWith('/')) {
            return `https://www.raiplay.it${imageUrl}`;
        }
        
        // Se manca il protocollo, aggiunge https
        if (imageUrl.startsWith('//')) {
            return `https:${imageUrl}`;
        }
        
        return imageUrl;
    }

    // Estrae l'anno dal testo
    extractYearFromText(text) {
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? parseInt(yearMatch[0]) : null;
    }

    // Parse lista contenuti generica
    parseContentList(data, type, skip = 0) {
        const metas = [];
        
        try {
            if (data && Array.isArray(data)) {
                for (const item of data.slice(skip, skip + 20)) {
                    if (item.id && item.name) {
                        metas.push({
                            id: `raiplay:${item.id}`,
                            type: type,
                            name: item.name,
                            poster: this.normalizeImageUrl(item.image || item.poster),
                            description: item.description || '',
                            year: item.year,
                            genres: item.genres || genreMapper.extractGenresFromText(item.name)
                        });
                    }
                }
            }
        } catch (error) {
            logger.error(`Errore nel parsing lista contenuti: ${error.message}`);
        }
        
        return metas;
    }

    // Scraping fallback per nuove serie
    async scrapeNewSeries(skip = 0) {
        try {
            const response = await axios.get(`${this.baseUrl}/nuovi-programmi`, {
                headers: auth.getAuthenticatedHeaders(),
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const metas = [];

            $('.content-item, .program-card, .series-item').each((i, element) => {
                if (i < skip) return;
                if (metas.length >= 20) return;

                const $el = $(element);
                const link = $el.find('a').first().attr('href');
                const title = $el.find('h3, .title, .program-title').first().text().trim();
                const image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
                const description = $el.find('.description, p').first().text().trim();

                if (link && title) {
                    const id = this.extractIdFromUrl(link);
                    if (id) {
                        metas.push({
                            id: `raiplay:${id}`,
                            type: 'series',
                            name: title,
                            poster: this.normalizeImageUrl(image),
                            description: description || '',
                            genres: genreMapper.extractGenresFromText(title + ' ' + description)
                        });
                    }
                }
            });

            return metas;
        } catch (error) {
            logger.error(`Errore nello scraping nuove serie: ${error.message}`);
            return [];
        }
    }
}

module.exports = new CatalogHandler();
