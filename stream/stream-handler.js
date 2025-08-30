const axios = require("axios");
const cheerio = require("cheerio");

async function getStreams(type, id, extra, userId) {
  try {
    const url = `https://www.raiplay.it/programmi/${id}`;
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(response.data);

    // RaiPlay mette i dati video in uno script JSON
    let videoUrl = null;
    $('script').each((i, script) => {
      const content = $(script).html();
      if (content && content.includes(".m3u8")) {
        const match = content.match(/(https.*?\.m3u8)/);
        if (match) videoUrl = match[1];
      }
    });

    if (videoUrl) {
      return {
        streams: [
          {
            title: "RaiPlay",
            url: videoUrl
          }
        ]
      };
    } else {
      return { streams: [] };
    }
  } catch (err) {
    console.error("Errore in getStreams:", err.message);
    return { streams: [] };
  }
}

module.exports = { getStreams };    }

    // Stream per contenuti on-demand
    async getOnDemandStream(id, config = {}, userId = 'default') {
        const raiplayId = id.replace('raiplay:', '');
        
        try {
            // Estrae i flussi video dal contenuto
            const streams = await videoExtractor.extractVideoStreams(raiplayId, config, userId);
            
            if (streams && streams.length > 0) {
                // Ordina per qualità se specificato
                const qualityPreference = config.quality_preference || 'auto';
                const sortedStreams = this.sortStreamsByQuality(streams, qualityPreference);

                // Aggiungi sottotitoli se disponibili e richiesti
                if (config.enable_subtitles) {
                    for (const stream of sortedStreams) {
                        const subtitles = await this.getSubtitles(id, userId);
                        if (subtitles.length > 0) {
                            stream.subtitles = subtitles;
                        }
                    }
                }

                return sortedStreams;
            }

            return [];

        } catch (error) {
            logger.error(`Errore nel recupero stream on-demand ${raiplayId}: ${error.message}`);
            return [];
        }
    }

    // Ordinamento stream per qualità
    sortStreamsByQuality(streams, qualityPreference) {
        if (!streams || streams.length === 0) return [];

        // Clona l'array per non modificare l'originale
        const sortedStreams = [...streams];

        switch (qualityPreference) {
            case 'hd':
                // Priorità alle qualità più alte
                return sortedStreams.sort((a, b) => {
                    const aQuality = this.getStreamQualityScore(a.title || a.url);
                    const bQuality = this.getStreamQualityScore(b.title || b.url);
                    return bQuality - aQuality;
                });

            case 'sd':
                // Priorità alle qualità più basse
                return sortedStreams.sort((a, b) => {
                    const aQuality = this.getStreamQualityScore(a.title || a.url);
                    const bQuality = this.getStreamQualityScore(b.title || b.url);
                    return aQuality - bQuality;
                });

            case 'auto':
            default:
                // Ordine naturale con preferenza per HD ma fallback su SD
                return sortedStreams.sort((a, b) => {
                    const aQuality = this.getStreamQualityScore(a.title || a.url);
                    const bQuality = this.getStreamQualityScore(b.title || b.url);
                    
                    // Se sono entrambi HD o entrambi SD, mantieni l'ordine originale
                    if ((aQuality >= 720 && bQuality >= 720) || (aQuality < 720 && bQuality < 720)) {
                        return 0;
                    }
                    
                    // Altrimenti priorità HD
                    return bQuality - aQuality;
                });
        }
    }

    // Punteggio qualità stream
    getStreamQualityScore(text) {
        if (!text) return 480;

        const lowerText = text.toLowerCase();

        // Cerca indicatori di qualità nel testo
        if (lowerText.includes('1080p') || lowerText.includes('1080')) return 1080;
        if (lowerText.includes('720p') || lowerText.includes('720')) return 720;
        if (lowerText.includes('480p') || lowerText.includes('480')) return 480;
        if (lowerText.includes('360p') || lowerText.includes('360')) return 360;
        if (lowerText.includes('hd')) return 720;
        if (lowerText.includes('sd')) return 480;

        // Cerca nel URL
        if (lowerText.includes('_1080') || lowerText.includes('-1080')) return 1080;
        if (lowerText.includes('_720') || lowerText.includes('-720')) return 720;
        if (lowerText.includes('_480') || lowerText.includes('-480')) return 480;

        // Default
        return 480;
    }

    // Recupera sottotitoli
    async getSubtitles(id, userId = 'default') {
        try {
            const raiplayId = id.replace('raiplay:', '').replace('live:', '');
            const subtitles = await videoExtractor.extractSubtitles(raiplayId, userId);
            
            return subtitles || [];

        } catch (error) {
            logger.error(`Errore nel recupero sottotitoli per ${id}: ${error.message}`);
            return [];
        }
    }

    // Verifica disponibilità stream
    async checkStreamAvailability(id, userId = 'default') {
        try {
            const streams = await this.getStreams(null, id, {}, userId);
            return streams.streams && streams.streams.length > 0;

        } catch (error) {
            logger.error(`Errore nella verifica disponibilità stream ${id}: ${error.message}`);
            return false;
        }
    }

    // Ottieni informazioni tecniche stream
    async getStreamInfo(id, userId = 'default') {
        try {
            const raiplayId = id.replace('raiplay:', '');
            return await videoExtractor.getVideoInfo(raiplayId, userId);

        } catch (error) {
            logger.error(`Errore nel recupero info stream ${id}: ${error.message}`);
            return null;
        }
    }

    // Cleanup cache stream scaduti
    cleanupStreamCache() {
        const now = Date.now();
        const cacheKeys = cache.keys();

        for (const key of cacheKeys) {
            if (key.startsWith('stream_')) {
                const cached = cache.get(key);
                if (cached && cached.timestamp && (now - cached.timestamp) > this.cacheTimeout) {
                    cache.delete(key);
                }
            }
        }
    }
}

module.exports = new StreamHandler();
