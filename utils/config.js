const config = {
    // Configurazione server
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        env: process.env.NODE_ENV || 'development',
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }
    },

    // Configurazione RaiPlay
    raiplay: {
        baseUrl: 'https://www.raiplay.it',
        apiUrl: 'https://www.raiplay.it/api',
        mediaUrl: 'https://mediapolis.rai.it',
        relinkerUrl: 'https://mediapolis.rai.it/relinker/relinkerServlet.htm',
        
        // Timeout per le richieste
        timeout: {
            default: 10000, // 10 secondi
            auth: 15000,    // 15 secondi per login
            stream: 30000   // 30 secondi per stream
        },

        // Rate limiting
        rateLimit: {
            requests: 100,        // Richieste per finestra
            windowMs: 60 * 1000, // 1 minuto
            delayMs: 100         // Delay tra richieste
        },

        // Headers predefiniti
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
    },

    // Configurazione cache
    cache: {
        // Timeout cache (in millisecondi)
        timeout: {
            catalog: 3600000,    // 1 ora per cataloghi
            stream: 300000,      // 5 minuti per stream
            meta: 1800000,       // 30 minuti per metadati
            auth: 86400000       // 24 ore per sessioni auth
        },

        // Dimensioni massime cache
        maxSize: {
            catalog: 1000,       // Massimo 1000 elementi catalogo
            stream: 100,         // Massimo 100 stream in cache
            meta: 500            // Massimo 500 metadati
        },

        // Pulizia automatica cache
        cleanup: {
            enabled: true,
            interval: 300000     // Ogni 5 minuti
        }
    },

    // Configurazione logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: {
            enabled: true,
            path: './logs',
            filename: 'app.log',
            maxSize: '10m',
            maxFiles: 5
        },
        console: {
            enabled: true,
            colorize: true,
            timestamp: true
        }
    },

    // Configurazione addon Stremio
    addon: {
        // Timeout per le risposte
        timeout: 30000,

        // Cache headers
        cacheHeaders: {
            catalog: 'public, max-age=3600',      // 1 ora
            stream: 'public, max-age=300',        // 5 minuti  
            meta: 'public, max-age=1800'          // 30 minuti
        },

        // Configurazione paginazione
        pagination: {
            defaultLimit: 20,
            maxLimit: 100
        }
    },

    // Configurazione sicurezza
    security: {
        // Protezione rate limiting
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minuti
            max: 1000,                 // Limite richieste per IP
            message: 'Troppe richieste, riprova più tardi'
        },

        // Headers di sicurezza
        helmet: {
            contentSecurityPolicy: false, // Disabilitato per addon
            crossOriginEmbedderPolicy: false
        },

        // Validazione parametri
        validation: {
            maxIdLength: 200,
            maxExtraLength: 1000
        }
    },

    // Configurazione qualità video
    video: {
        qualities: ['1080p', '720p', '480p', '360p'],
        defaultQuality: 'auto',
        
        // Formati supportati
        formats: ['m3u8', 'mp4', 'mpd'],
        
        // Codec supportati
        codecs: ['h264', 'h265', 'vp9']
    },

    // Configurazione sottotitoli
    subtitles: {
        languages: ['it', 'en'],
        formats: ['vtt', 'srt'],
        defaultEnabled: true
    },

    // Configurazione monitoraggio
    monitoring: {
        enabled: process.env.NODE_ENV === 'production',
        
        // Metriche da raccogliere
        metrics: {
            requests: true,
            errors: true,
            cache: true,
            auth: true
        },

        // Health check
        healthCheck: {
            enabled: true,
            path: '/health',
            interval: 30000 // Ogni 30 secondi
        }
    },

    // Configurazioni ambiente-specifiche
    development: {
        debug: true,
        hotReload: true,
        verboseLogging: true
    },

    production: {
        debug: false,
        compression: true,
        clustering: process.env.CLUSTER_MODE === 'true'
    },

    // Configurazione database (se necessario in futuro)
    database: {
        type: process.env.DB_TYPE || 'memory',
        url: process.env.DATABASE_URL,
        pool: {
            min: 2,
            max: 10
        }
    }
};

// Merge configurazioni per ambiente
const envConfig = config[config.server.env] || {};
Object.assign(config, envConfig);

// Validazione configurazione
function validateConfig() {
    const required = [
        'server.port',
        'raiplay.baseUrl',
        'cache.timeout.catalog'
    ];

    for (const path of required) {
        const keys = path.split('.');
        let value = config;
        
        for (const key of keys) {
            value = value[key];
            if (value === undefined) {
                throw new Error(`Configurazione mancante: ${path}`);
            }
        }
    }
}

// Esegui validazione
validateConfig();

module.exports = config;