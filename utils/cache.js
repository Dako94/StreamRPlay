const logger = require('./logger');
const config = require('./config');

class Cache {
    constructor() {
        this.store = new Map();
        this.timers = new Map();
        
        // Avvia cleanup automatico se abilitato
        if (config.cache.cleanup.enabled) {
            this.startAutoCleanup();
        }
    }

    // Imposta valore in cache
    set(key, value, ttl = null) {
        try {
            // Usa TTL di default se non specificato
            if (ttl === null) {
                ttl = this.getDefaultTTL(key);
            }

            // Rimuovi timer esistente se presente
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
            }

            // Memorizza il valore con timestamp
            const item = {
                value: value,
                timestamp: Date.now(),
                ttl: ttl,
                key: key
            };

            this.store.set(key, item);

            // Imposta timer per rimozione automatica
            if (ttl > 0) {
                const timer = setTimeout(() => {
                    this.delete(key);
                }, ttl);

                this.timers.set(key, timer);
            }

            logger.cache('set', key);
            this.enforceMaxSize();

            return true;
        } catch (error) {
            logger.logError(error, 'cache.set');
            return false;
        }
    }

    // Recupera valore dalla cache
    get(key) {
        try {
            const item = this.store.get(key);
            
            if (!item) {
                logger.cache('get', key, false);
                return null;
            }

            // Verifica se è scaduto
            const now = Date.now();
            if (item.ttl > 0 && (now - item.timestamp) > item.ttl) {
                this.delete(key);
                logger.cache('get', key, false);
                return null;
            }

            logger.cache('get', key, true);
            return item.value;
        } catch (error) {
            logger.logError(error, 'cache.get');
            return null;
        }
    }

    // Verifica se esiste in cache
    has(key) {
        const item = this.store.get(key);
        if (!item) return false;

        // Verifica scadenza
        const now = Date.now();
        if (item.ttl > 0 && (now - item.timestamp) > item.ttl) {
            this.delete(key);
            return false;
        }

        return true;
    }

    // Rimuove dalla cache
    delete(key) {
        try {
            // Rimuovi timer se esistente
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
                this.timers.delete(key);
            }

            const deleted = this.store.delete(key);
            if (deleted) {
                logger.cache('delete', key);
            }

            return deleted;
        } catch (error) {
            logger.logError(error, 'cache.delete');
            return false;
        }
    }

    // Pulisce tutta la cache
    clear() {
        try {
            // Cancella tutti i timer
            for (const timer of this.timers.values()) {
                clearTimeout(timer);
            }

            this.timers.clear();
            this.store.clear();

            logger.info('Cache cleared');
            return true;
        } catch (error) {
            logger.logError(error, 'cache.clear');
            return false;
        }
    }

    // Ottieni tutte le chiavi
    keys() {
        return Array.from(this.store.keys());
    }

    // Ottieni statistiche cache
    getStats() {
        const now = Date.now();
        let expired = 0;
        let valid = 0;

        for (const [key, item] of this.store) {
            if (item.ttl > 0 && (now - item.timestamp) > item.ttl) {
                expired++;
            } else {
                valid++;
            }
        }

        return {
            total: this.store.size,
            valid: valid,
            expired: expired,
            timers: this.timers.size,
            memory: this.getMemoryUsage()
        };
    }

    // Stima utilizzo memoria
    getMemoryUsage() {
        let size = 0;
        
        for (const [key, item] of this.store) {
            size += this.estimateSize(key) + this.estimateSize(item);
        }

        return this.formatBytes(size);
    }

    // Stima dimensione oggetto
    estimateSize(obj) {
        let size = 0;

        if (typeof obj === 'string') {
            size = obj.length * 2; // UTF-16
        } else if (typeof obj === 'number') {
            size = 8;
        } else if (typeof obj === 'boolean') {
            size = 1;
        } else if (obj === null || obj === undefined) {
            size = 0;
        } else if (typeof obj === 'object') {
            size = JSON.stringify(obj).length * 2;
        }

        return size;
    }

    // Formatta bytes in formato leggibile
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // TTL di default basato sul tipo di chiave
    getDefaultTTL(key) {
        if (key.startsWith('catalog_')) {
            return config.cache.timeout.catalog;
        } else if (key.startsWith('stream_')) {
            return config.cache.timeout.stream;
        } else if (key.startsWith('meta_')) {
            return config.cache.timeout.meta;
        } else if (key.startsWith('auth_')) {
            return config.cache.timeout.auth;
        }

        return config.cache.timeout.catalog; // Default
    }

    // Applica limite massimo dimensioni
    enforceMaxSize() {
        const catalogKeys = this.keys().filter(k => k.startsWith('catalog_'));
        const streamKeys = this.keys().filter(k => k.startsWith('stream_'));
        const metaKeys = this.keys().filter(k => k.startsWith('meta_'));

        // Pulisci catalog se troppi
        if (catalogKeys.length > config.cache.maxSize.catalog) {
            this.cleanupOldest(catalogKeys, config.cache.maxSize.catalog);
        }

        // Pulisci stream se troppi
        if (streamKeys.length > config.cache.maxSize.stream) {
            this.cleanupOldest(streamKeys, config.cache.maxSize.stream);
        }

        // Pulisci meta se troppi
        if (metaKeys.length > config.cache.maxSize.meta) {
            this.cleanupOldest(metaKeys, config.cache.maxSize.meta);
        }
    }

    // Rimuovi elementi più vecchi
    cleanupOldest(keys, maxSize) {
        const items = keys.map(key => ({
            key,
            timestamp: this.store.get(key)?.timestamp || 0
        }));

        // Ordina per timestamp (più vecchi prima)
        items.sort((a, b) => a.timestamp - b.timestamp);

        // Rimuovi elementi in eccesso
        const toRemove = items.slice(0, items.length - maxSize);
        for (const item of toRemove) {
            this.delete(item.key);
        }

        if (toRemove.length > 0) {
            logger.info(`Cache cleanup: removed ${toRemove.length} old items`);
        }
    }

    // Cleanup automatico elementi scaduti
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, item] of this.store) {
            if (item.ttl > 0 && (now - item.timestamp) > item.ttl) {
                this.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.info(`Cache cleanup: removed ${cleaned} expired items`);
        }

        return cleaned;
    }

    // Avvia cleanup automatico
    startAutoCleanup() {
        const interval = config.cache.cleanup.interval;
        
        setInterval(() => {
            this.cleanup();
        }, interval);

        logger.info(`Cache auto-cleanup started (every ${interval}ms)`);
    }

    // Metodi specifici per l'addon

    // Cache per cataloghi
    setCatalog(catalogId, type, extra, data, ttl = null) {
        const key = `catalog_${catalogId}_${type}_${JSON.stringify(extra)}`;
        return this.set(key, data, ttl);
    }

    getCatalog(catalogId, type, extra) {
        const key = `catalog_${catalogId}_${type}_${JSON.stringify(extra)}`;
        return this.get(key);
    }

    // Cache per stream
    setStream(id, userId, data, ttl = null) {
        const key = `stream_${id}_${userId}`;
        return this.set(key, data, ttl);
    }

    getStream(id, userId) {
        const key = `stream_${id}_${userId}`;
        return this.get(key);
    }

    // Cache per metadati
    setMeta(id, data, ttl = null) {
        const key = `meta_${id}`;
        return this.set(key, data, ttl);
    }

    getMeta(id) {
        const key = `meta_${id}`;
        return this.get(key);
    }

    // Cache per autenticazione
    setAuth(userId, data, ttl = null) {
        const key = `auth_${userId}`;
        return this.set(key, data, ttl);
    }

    getAuth(userId) {
        const key = `auth_${userId}`;
        return this.get(key);
    }
}

module.exports = new Cache();