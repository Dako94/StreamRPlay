const axios = require('axios');
const cheerio = require('cheerio');
const auth = require('../auth/raiplay-auth');
const logger = require('../utils/logger');

class VideoExtractor {
    constructor() {
        this.baseUrl = 'https://www.raiplay.it';
        this.mediaUrl = 'https://mediapolis.rai.it';
        this.relinkerUrl = 'https://mediapolis.rai.it/relinker/relinkerServlet.htm';
    }

    // Estrae flussi video per contenuti on-demand
    async extractVideoStreams(raiplayId, config = {}, userId = 'default') {
        try {
            logger.info(`Extracting video streams for: ${raiplayId}`);

            // Prima prova con l'API
            let streams = await this.extractFromAPI(raiplayId, userId);
            
            // Se l'API fallisce, prova con scraping HTML
            if (!streams || streams.length === 0) {
                streams = await this.extractFromHTML(raiplayId, userId);
            }

            // Se ancora nulla, prova metodi alternativi
            if (!streams || streams.length === 0) {
                streams = await this.extractFromRelinker(raiplayId, userId);
            }

            return this.processStreams(streams, config);

        } catch (error) {
            logger.logError(error, `extractVideoStreams:${raiplayId}`);
            return [];
        }
    }

    // Estrazione tramite API RaiPlay
    async extractFromAPI(raiplayId, userId) {
        try {
            // URL dell'API per ottenere informazioni video
            const apiUrls = [
                `${this.baseUrl}/api/media/${raiplayId}`,
                `${this.baseUrl}/api/video/${raiplayId}`,
                `${this.baseUrl}/api/program/${raiplayId}`
            ];

            for (const apiUrl of apiUrls) {
                try {
                    const response = await axios.get(apiUrl, {
                        headers: auth.getAuthenticatedHeaders(userId),
                        timeout: 10000
                    });

                    if (response.data) {
                        const streams = this.parseAPIResponse(response.data);
                        if (streams.length > 0) {
                            logger.info(`API extraction successful: ${apiUrl}`);
                            return streams;
                        }
                    }
                } catch (apiError) {
                    logger.debug(`API URL failed: ${apiUrl}`, { error: apiError.message });
                }
            }

            return [];
        } catch (error) {
            logger.logError(error, 'extractFromAPI');
            return [];
        }
    }

    // Parsing risposta API
    parseAPIResponse(data) {
        const streams = [];

        try {
            // Vari formati possibili di risposta API
            if (data.video && data.video.content_url) {
                streams.push({
                    url: data.video.content_url,
                    title: 'RaiPlay Stream',
                    quality: this.extractQualityFromUrl(data.video.content_url)
                });
            }

            if (data.mediaUri) {
                streams.push({
                    url: data.mediaUri,
                    title: 'RaiPlay Stream',
                    quality: this.extractQualityFromUrl(data.mediaUri)
                });
            }

            if (data.streams && Array.isArray(data.streams)) {
                for (const stream of data.streams) {
                    if (stream.url) {
                        streams.push({
                            url: stream.url,
                            title: stream.title || 'RaiPlay Stream',
                            quality: stream.quality || this.extractQualityFromUrl(stream.url)
                        });
                    }
                }
            }

            if (data.media && data.media.relinker) {
                const relinkerUrl = data.media.relinker;
                streams.push({
                    url: relinkerUrl,
                    title: 'RaiPlay Relinker',
                    isRelinker: true
                });
            }

        } catch (error) {
            logger.logError(error, 'parseAPIResponse');
        }

        return streams;
    }

    // Estrazione tramite scraping HTML
    async extractFromHTML(raiplayId, userId) {
        try {
            const pageUrl = `${this.baseUrl}/video/${raiplayId}`;
            
            const response = await axios.get(pageUrl, {
                headers: auth.getAuthenticatedHeaders(userId),
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const streams = [];

            // Cerca negli script JSON-LD
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const jsonData = JSON.parse($(el).html());
                    if (jsonData.contentUrl) {
                        streams.push({
                            url: jsonData.contentUrl,
                            title: 'RaiPlay Stream (JSON-LD)',
                            quality: this.extractQualityFromUrl(jsonData.contentUrl)
                        });
                    }
                } catch (parseError) {
                    // Continua con il prossimo script
                }
            });

            // Cerca nei tag script per variabili JavaScript
            $('script:not([src])').each((i, el) => {
                const scriptContent = $(el).html();
                if (!scriptContent) return;

                // Pattern per trovare URL dei video
                const patterns = [
                    /"mediaUri":"([^"]+)"/g,
                    /"contentUrl":"([^"]+)"/g,
                    /"video_url":"([^"]+)"/g,
                    /videoURL["\s]*:["\s]*"([^"]+)"/g,
                    /relinker["\s]*:["\s]*"([^"]+)"/g
                ];

                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(scriptContent)) !== null) {
                        const url = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
                        if (url.includes('.m3u8') || url.includes('relinker') || url.includes('.mp4')) {
                            streams.push({
                                url: url,
                                title: 'RaiPlay Stream (Script)',
                                quality: this.extractQualityFromUrl(url),
                                isRelinker: url.includes('relinker')
                            });
                        }
                    }
                }
            });

            // Cerca attributi data-* negli elementi video
            $('video, [data-video-url], [data-media-uri]').each((i, el) => {
                const $el = $(el);
                const videoUrl = $el.attr('data-video-url') || $el.attr('data-media-uri') || $el.attr('src');
                
                if (videoUrl) {
                    streams.push({
                        url: videoUrl,
                        title: 'RaiPlay Stream (Data Attr)',
                        quality: this.extractQualityFromUrl(videoUrl)
                    });
                }
            });

            // Rimuovi duplicati
            const uniqueStreams = this.removeDuplicateStreams(streams);
            
            if (uniqueStreams.length > 0) {
                logger.info(`HTML extraction successful: found ${uniqueStreams.length} streams`);
            }

            return uniqueStreams;

        } catch (error) {
            logger.logError(error, 'extractFromHTML');
            return [];
        }
    }

    // Estrazione tramite Relinker RAI
    async extractFromRelinker(raiplayId, userId) {
        try {
            // Pattern comuni per gli ID Relinker RAI
            const relinkerPatterns = [
                `cont=${raiplayId}`,
                `id=${raiplayId}`,
                `video=${raiplayId}`
            ];

            const streams = [];

            for (const pattern of relinkerPatterns) {
                try {
                    const relinkerUrl = `${this.relinkerUrl}?${pattern}`;
                    
                    const response = await axios.get(relinkerUrl, {
                        headers: auth.getAuthenticatedHeaders(userId),
                        timeout: 10000,
                        maxRedirects: 5
                    });

                    // Il relinker dovrebbe restituire un URL M3U8 o MP4
                    const finalUrl = response.request.responseURL || response.config.url;
                    
                    if (finalUrl.includes('.m3u8') || finalUrl.includes('.mp4')) {
                        streams.push({
                            url: finalUrl,
                            title: 'RaiPlay Stream (Relinker)',
                            quality: this.extractQualityFromUrl(finalUrl)
                        });
                        
                        logger.info(`Relinker extraction successful: ${pattern}`);
                        break; // Trovato, esci dal loop
                    }

                } catch (relinkerError) {
                    logger.debug(`Relinker pattern failed: ${pattern}`, { error: relinkerError.message });
                }
            }

            return streams;

        } catch (error) {
            logger.logError(error, 'extractFromRelinker');
            return [];
        }
    }

    // Estrae URL per stream live
    async extractLiveStreamUrl(relinkerUrl, userId = 'default') {
        try {
            logger.info(`Extracting live stream: ${relinkerUrl}`);

            const response = await axios.get(relinkerUrl, {
                headers: auth.getAuthenticatedHeaders(userId),
                timeout: 15000,
                maxRedirects: 10
            });

            // L'URL finale dovrebbe essere l'M3U8
            const finalUrl = response.request.responseURL || response.config.url;
            
            if (finalUrl.includes('.m3u8')) {
                logger.info(`Live stream extraction successful: ${finalUrl}`);
                return finalUrl;
            }

            // Se non è un M3U8, prova a parsare il contenuto
            if (response.data && typeof response.data === 'string') {
                const m3u8Match = response.data.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/);
                if (m3u8Match) {
                    return m3u8Match[0];
                }
            }

            return null;

        } catch (error) {
            logger.logError(error, 'extractLiveStreamUrl');
            return null;
        }
    }

    // Estrae sottotitoli
    async extractSubtitles(raiplayId, userId = 'default') {
        try {
            const pageUrl = `${this.baseUrl}/video/${raiplayId}`;
            
            const response = await axios.get(pageUrl, {
                headers: auth.getAuthenticatedHeaders(userId),
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const subtitles = [];

            // Cerca sottotitoli nei vari formati
            $('track, [data-subtitle], [data-captions]').each((i, el) => {
                const $el = $(el);
                const src = $el.attr('src') || $el.attr('data-subtitle') || $el.attr('data-captions');
                const lang = $el.attr('srclang') || $el.attr('lang') || 'it';
                const label = $el.attr('label') || `Sottotitoli ${lang.toUpperCase()}`;

                if (src) {
                    subtitles.push({
                        url: src.startsWith('http') ? src : `${this.baseUrl}${src}`,
                        lang: lang,
                        label: label
                    });
                }
            });

            // Cerca sottotitoli negli script
            $('script:not([src])').each((i, el) => {
                const scriptContent = $(el).html();
                if (!scriptContent) return;

                const subtitlePatterns = [
                    /"subtitles":\s*"([^"]+)"/g,
                    /"captions":\s*"([^"]+)"/g,
                    /"vtt":\s*"([^"]+)"/g
                ];

                for (const pattern of subtitlePatterns) {
                    let match;
                    while ((match = pattern.exec(scriptContent)) !== null) {
                        const url = match[1];
                        if (url.includes('.vtt') || url.includes('.srt')) {
                            subtitles.push({
                                url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
                                lang: 'it',
                                label: 'Sottotitoli Italiani'
                            });
                        }
                    }
                }
            });

            return subtitles;

        } catch (error) {
            logger.logError(error, 'extractSubtitles');
            return [];
        }
    }

    // Utility functions

    // Estrae informazioni qualità dall'URL
    extractQualityFromUrl(url) {
        if (!url) return 'auto';

        const lowerUrl = url.toLowerCase();
        
        if (lowerUrl.includes('1080') || lowerUrl.includes('hd')) return '1080p';
        if (lowerUrl.includes('720')) return '720p';
        if (lowerUrl.includes('480')) return '480p';
        if (lowerUrl.includes('360')) return '360p';
        
        return 'auto';
    }

    // Rimuove stream duplicati
    removeDuplicateStreams(streams) {
        const seen = new Set();
        const unique = [];

        for (const stream of streams) {
            if (!seen.has(stream.url)) {
                seen.add(stream.url);
                unique.push(stream);
            }
        }

        return unique;
    }

    // Processa e formatta stream per Stremio
    processStreams(streams, config = {}) {
        if (!Array.isArray(streams)) return [];

        const processed = [];

        for (const stream of streams) {
            // Risolvi relinker se necessario
            if (stream.isRelinker && stream.url) {
                // Per ora aggiungiamo il relinker direttamente
                // In futuro potrebbe essere risolto dinamicamente
                processed.push({
                    url: stream.url,
                    title: `${stream.title || 'RaiPlay Stream'} (${stream.quality || 'auto'})`,
                    behaviorHints: {
                        notWebReady: true,
                        bingeGroup: `raiplay-${Date.now()}`
                    }
                });
            } else if (stream.url) {
                processed.push({
                    url: stream.url,
                    title: `${stream.title || 'RaiPlay Stream'} (${stream.quality || 'auto'})`,
                    behaviorHints: {
                        notWebReady: true,
                        bingeGroup: `raiplay-${Date.now()}`
                    }
                });
            }
        }

        return processed;
    }

    // Ottiene informazioni video dettagliate
    async getVideoInfo(raiplayId, userId = 'default') {
        try {
            const apiUrl = `${this.baseUrl}/api/media/${raiplayId}`;
            
            const response = await axios.get(apiUrl, {
                headers: auth.getAuthenticatedHeaders(userId),
                timeout: 10000
            });

            return response.data;

        } catch (error) {
            logger.logError(error, 'getVideoInfo');
            return null;
        }
    }
}

module.exports = new VideoExtractor();