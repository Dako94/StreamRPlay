const addonSDK = require('stremio-addon-sdk');
const express = require('express');
const cors = require('cors');

// Import dei moduli dell'addon
const manifest = require('./manifest');
const catalogHandler = require('./catalog/catalog-handler');
const streamHandler = require('./stream/stream-handler');
const auth = require('./auth/raiplay-auth');
const config = require('./utils/config');
const logger = require('./utils/logger');
const cache = require('./utils/cache');

// Inizializzazione addon
const builder = new addonSDK.addonBuilder(manifest);

// Middleware per logging delle richieste
function requestLogger(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.request(req.method, req.url, res.statusCode, duration);
    });
    
    next();
}

// Middleware per parsing configurazione utente
function parseUserConfig(req, res, next) {
    try {
        // Estrai configurazione dall'URL se presente
        const configStr = req.params.config || req.query.config;
        
        if (configStr) {
            try {
                req.userConfig = JSON.parse(Buffer.from(configStr, 'base64').toString());
                req.userId = req.userConfig.raiplay_email || 'anonymous';
            } catch (parseError) {
                logger.warn('Invalid user config format', { configStr });
                req.userConfig = {};
                req.userId = 'anonymous';
            }
        } else {
            req.userConfig = {};
            req.userId = 'anonymous';
        }
        
        next();
    } catch (error) {
        logger.logError(error, 'parseUserConfig');
        req.userConfig = {};
        req.userId = 'anonymous';
        next();
    }
}

// Middleware per autenticazione automatica
async function autoAuth(req, res, next) {
    try {
        const { raiplay_email, raiplay_password } = req.userConfig;
        
        if (raiplay_email && raiplay_password && !auth.isAuthenticated(req.userId)) {
            logger.info(`Attempting auto-login for user: ${req.userId}`);
            
            const loginResult = await auth.login(raiplay_email, raiplay_password, req.userId);
            
            if (loginResult.success) {
                logger.auth('auto-login', req.userId, true);
            } else {
                logger.auth('auto-login', req.userId, false);
            }
        }
        
        next();
    } catch (error) {
        logger.logError(error, 'autoAuth');
        next(); // Continua anche in caso di errore auth
    }
}

// Handler per i cataloghi
builder.defineCatalogHandler(async (args) => {
    const startTime = Date.now();
    
    try {
        logger.info('Catalog request', args);
        
        const { type, id, extra = {} } = args;
        const result = await catalogHandler.getCatalog(type, id, extra, 'anonymous');
        
        const duration = Date.now() - startTime;
        logger.performance('catalog', duration, { catalogId: id, itemCount: result.metas?.length || 0 });
        
        return {
            metas: result.metas || [],
            cacheMaxAge: 3600 // 1 ora
        };
    } catch (error) {
        logger.logError(error, 'catalogHandler');
        return { metas: [] };
    }
});

// Handler per gli stream
builder.defineStreamHandler(async (args) => {
    const startTime = Date.now();
    
    try {
        logger.info('Stream request', args);
        
        const { type, id } = args;
        const userId = 'anonymous'; // Semplificato per ora
        
        const result = await streamHandler.getStreams(type, id, {}, userId);
        
        const duration = Date.now() - startTime;
        logger.performance('stream', duration, { 
            streamId: id, 
            streamCount: result.streams?.length || 0 
        });
        
        return {
            streams: result.streams || [],
            cacheMaxAge: 300 // 5 minuti
        };
    } catch (error) {
        logger.logError(error, 'streamHandler');
        return { streams: [] };
    }
});


// Configurazione Express
const app = express();

// CORS
app.use(cors(config.server.cors));

// Request logging
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Middleware personalizzati
app.use(parseUserConfig);
app.use(autoAuth);

// Mount dell'addon Stremio
app.use('/', builder.getInterface());

// Route aggiuntive

// Health check
app.get('/health', (req, res) => {
    const stats = cache.getStats();
    const memUsage = process.memoryUsage();
    
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: require('./package.json').version,
        cache: stats,
        memory: {
            rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
        }
    };
    
    logger.health('healthy', health);
    res.json(health);
});

// Statistiche addon
app.get('/stats', (req, res) => {
    const stats = {
        cache: cache.getStats(),
        sessions: auth.sessions ? auth.sessions.size : 0,
        uptime: process.uptime(),
        memory: process.memoryUsage()
    };
    
    res.json(stats);
});

// Pulizia cache manuale
app.post('/admin/clear-cache', (req, res) => {
    cache.clear();
    logger.info('Cache cleared manually');
    res.json({ message: 'Cache cleared successfully' });
});

// Test autenticazione
app.post('/admin/test-auth', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        const result = await auth.login(email, password, 'test-user');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route per configurazione dinamica
app.get('/configure/:config?', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const configParam = req.params.config ? `/${req.params.config}` : '';
    
    const configManifest = {
        ...manifest,
        behaviorHints: {
            ...manifest.behaviorHints,
            configurationRequired: true
        }
    };
    
    res.json(configManifest);
});

// Gestione errori globale
app.use((err, req, res, next) => {
    logger.logError(err, 'globalErrorHandler');
    
    res.status(500).json({
        error: 'Internal server error',
        message: config.server.env === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    logger.warn(`404 - Route not found: ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    
    // Chiudi server
    server.close((err) => {
        if (err) {
            logger.logError(err, 'server.close');
            process.exit(1);
        }
        
        // Pulizia risorse
        cache.clear();
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
    });
    
    // Forza chiusura dopo 30 secondi
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
}

// Gestione errori non catturati
process.on('uncaughtException', (err) => {
    logger.logError(err, 'uncaughtException');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at Promise', { reason, promise });
    process.exit(1);
});

// Avvio server
const PORT = config.server.port;
const HOST = config.server.host;

const server = app.listen(PORT, HOST, () => {
    logger.info(`🚀 RaiPlay Addon running on ${HOST}:${PORT}`);
    logger.info(`📺 Manifest URL: http://${HOST}:${PORT}/manifest.json`);
    logger.info(`🌍 Environment: ${config.server.env}`);
    logger.info(`📊 Health check: http://${HOST}:${PORT}/health`);
    
    // Log configurazione
    logger.info('Configuration loaded', {
        cacheEnabled: config.cache.cleanup.enabled,
        authEnabled: true,
        loggingLevel: config.logging.level
    });
});

// Funzione per recuperare i metadati da RaiPlay
const axios = require('axios');
const cheerio = require('cheerio');

async function getMetaDataFromRaiPlay(type, id) {
    try {
        const url = `https://www.raiplay.it/${id}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const name = $('h1').text().trim();
        const description = $('meta[name="description"]').attr('content');
        const poster = $('meta[property="og:image"]').attr('content');
        const background = poster;

        if (type === 'movie') {
            return {
                id: id,
                type: 'movie',
                name: name,
                poster: poster,
                background: background,
                description: description,
                // Campi aggiuntivi (esempio)
                releaseInfo: '2023', // Da personalizzare
                runtime: 120, // Da personalizzare
                genres: ['Drammatico'], // Da personalizzare
            };
        } else if (type === 'series') {
            return {
                id: id,
                type: 'series',
                name: name,
                poster: poster,
                background: background,
                description: description,
                // Campi aggiuntivi (esempio)
                episodes: [], // Da popolare con episodi reali
            };
        } else if (type === 'channel') {
            return {
                id: id,
                type: 'channel',
                name: name,
                logo: poster,
                description: description,
            };
        } else {
            return null;
        }
    } catch (error) {
        logger.logError(error, 'getMetaDataFromRaiPlay');
        return null;
    }
}
// Export per testing
module.exports = app;
