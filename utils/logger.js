const fs = require('fs');
const path = require('path');
const config = require('./config');

class Logger {
    constructor() {
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        
        this.currentLevel = this.levels[config.logging.level] || this.levels.info;
        this.colors = {
            error: '\x1b[31m',  // Rosso
            warn: '\x1b[33m',   // Giallo
            info: '\x1b[36m',   // Ciano
            debug: '\x1b[90m',  // Grigio
            reset: '\x1b[0m'
        };

        // Crea directory log se necessaria
        if (config.logging.file.enabled) {
            this.ensureLogDirectory();
        }
    }

    // Crea directory per i log
    ensureLogDirectory() {
        const logDir = config.logging.file.path;
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    // Formatta timestamp
    formatTimestamp() {
        return new Date().toISOString();
    }

    // Formatta messaggio
    formatMessage(level, message, meta = {}) {
        const timestamp = this.formatTimestamp();
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }

    // Scrive su file
    writeToFile(level, formattedMessage) {
        if (!config.logging.file.enabled) return;

        const logFile = path.join(config.logging.file.path, config.logging.file.filename);
        const errorFile = path.join(config.logging.file.path, 'error.log');

        try {
            // Scrivi sempre nel log principale
            fs.appendFileSync(logFile, formattedMessage + '\n');

            // Scrivi errori anche nel file separato
            if (level === 'error') {
                fs.appendFileSync(errorFile, formattedMessage + '\n');
            }

            // Gestione rotazione log (semplificata)
            this.rotateLogIfNeeded(logFile);
        } catch (err) {
            console.error('Errore nella scrittura log:', err);
        }
    }

    // Rotazione log semplice
    rotateLogIfNeeded(logFile) {
        try {
            const stats = fs.statSync(logFile);
            const maxSize = this.parseSize(config.logging.file.maxSize);
            
            if (stats.size > maxSize) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const rotatedFile = logFile.replace('.log', `_${timestamp}.log`);
                
                // Sposta il file corrente
                fs.renameSync(logFile, rotatedFile);
                
                // Cleanup vecchi log
                this.cleanupOldLogs();
            }
        } catch (err) {
            console.error('Errore nella rotazione log:', err);
        }
    }

    // Converti dimensioni stringa in bytes
    parseSize(sizeStr) {
        const units = { k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
        const match = sizeStr.toLowerCase().match(/^(\d+)([kmg]?)$/);
        
        if (!match) return 10 * 1024 * 1024; // Default 10MB
        
        const size = parseInt(match[1]);
        const unit = match[2] || '';
        
        return size * (units[unit] || 1);
    }

    // Pulizia log vecchi
    cleanupOldLogs() {
        try {
            const logDir = config.logging.file.path;
            const files = fs.readdirSync(logDir);
            const logFiles = files.filter(f => f.startsWith('app_') && f.endsWith('.log'));
            
            // Ordina per data (più recenti prima)
            logFiles.sort((a, b) => {
                const statsA = fs.statSync(path.join(logDir, a));
                const statsB = fs.statSync(path.join(logDir, b));
                return statsB.mtime - statsA.mtime;
            });

            // Rimuovi file oltre il limite
            const maxFiles = config.logging.file.maxFiles || 5;
            for (let i = maxFiles; i < logFiles.length; i++) {
                fs.unlinkSync(path.join(logDir, logFiles[i]));
            }
        } catch (err) {
            console.error('Errore nella pulizia log:', err);
        }
    }

    // Scrive su console
    writeToConsole(level, message, meta = {}) {
        if (!config.logging.console.enabled) return;

        const timestamp = config.logging.console.timestamp ? `[${this.formatTimestamp()}] ` : '';
        const color = config.logging.console.colorize ? this.colors[level] : '';
        const reset = config.logging.console.colorize ? this.colors.reset : '';
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : '';

        console.log(`${color}${timestamp}${level.toUpperCase()}: ${message}${metaStr}${reset}`);
    }

    // Log generico
    log(level, message, meta = {}) {
        if (this.levels[level] > this.currentLevel) return;

        const formattedMessage = this.formatMessage(level, message, meta);
        
        this.writeToConsole(level, message, meta);
        this.writeToFile(level, formattedMessage);
    }

    // Metodi specifici per livello
    error(message, meta = {}) {
        this.log('error', message, meta);
        
        // Per errori, aggiungi anche stack trace se disponibile
        if (meta.error && meta.error.stack) {
            this.log('error', `Stack trace: ${meta.error.stack}`);
        }
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    // Metodi utili per l'addon
    request(method, url, status, duration) {
        this.info(`${method} ${url} - ${status}`, { 
            method, 
            url, 
            status, 
            duration: `${duration}ms` 
        });
    }

    auth(event, userId, success = true) {
        const level = success ? 'info' : 'warn';
        this.log(level, `Auth ${event} for user ${userId}`, { 
            event, 
            userId, 
            success 
        });
    }

    cache(action, key, hit = true) {
        this.debug(`Cache ${action}: ${key}`, { 
            action, 
            key, 
            hit 
        });
    }

    stream(event, id, quality = null) {
        this.info(`Stream ${event}: ${id}`, { 
            event, 
            id, 
            quality 
        });
    }

    // Performance logging
    performance(operation, duration, details = {}) {
        const level = duration > 5000 ? 'warn' : 'info'; // Warn se > 5 secondi
        this.log(level, `Performance: ${operation} took ${duration}ms`, {
            operation,
            duration,
            ...details
        });
    }

    // Error helper per catch blocks
    logError(error, context = '') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            code: error.code,
            context
        };

        this.error(`Error${context ? ` in ${context}` : ''}: ${error.message}`, { 
            error: errorInfo 
        });
    }

    // Metodo per statistiche periodiche
    stats(data) {
        this.info('System stats', data);
    }

    // Health check logging
    health(status, checks = {}) {
        const level = status === 'healthy' ? 'info' : 'error';
        this.log(level, `Health check: ${status}`, checks);
    }
}

module.exports = new Logger();