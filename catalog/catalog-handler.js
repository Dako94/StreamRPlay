const axios = require("axios");
const cheerio = require("cheerio");

async function searchRaiPlay(query) {
  try {
    const url = `https://www.raiplay.it/ricerca.html?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(response.data);
    const metas = [];

    $(".search-result__item").each((i, el) => {
      const title = $(el).find(".search-result__title").text().trim();
      const desc = $(el).find(".search-result__description").text().trim();
      const poster = $(el).find("img").attr("src");
      const href = $(el).find("a").attr("href"); // es: /programmi/pocoyo
      const id = href ? href.replace("/programmi/", "").replace(".html", "") : null;

      if (id) {
        metas.push({
          id,
          type: "series", // in RaiPlay la maggior parte è “serie”, ma puoi cambiare se serve
          name: title,
          description: desc,
          poster: poster ? `https:${poster}` : null
        });
      }
    });

    return metas;
  } catch (err) {
    console.error("Errore in searchRaiPlay:", err.message);
    return [];
  }
}

async function getCatalog(type, id, extra, userId) {
  if (id === "raiplay_search" && extra.search) {
    const results = await searchRaiPlay(extra.search);
    return { metas: results };
  }
  return { metas: [] };
}

module.exports = { getCatalog };            const response = await axios.get(url, {
                headers: auth.getAuthenticatedHeaders(),
                timeout: 10000
            });

            return this.parseContentList(response.data, 'series', skip);
        } catch (error) {
            // Fallback: scraping dalla pagina web
            return await this.scrapeNewSeries(skip);
        }
    }

    // Fiction RAI
    async getRaiFiction(extra = {}) {
        const url = `${this.baseUrl}/fiction`;
        const skip = parseInt(extra.skip) || 0;
        
        try {
            const response = await axios.get(url, {
                headers: auth.getAuthenticatedHeaders(),
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const metas = [];

            $('.slider-item, .card-container, .content-item').each((i, element) => {
                if (i < skip) return;
                if (metas.length >= 20) return;

                const $el = $(element);
                const link = $el.find('a').first().attr('href');
                const title = $el.find('h3, .title, .card-title').first().text().trim();
                const image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
                const description = $el.find('.description, .card-text, p').first().text().trim();

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
