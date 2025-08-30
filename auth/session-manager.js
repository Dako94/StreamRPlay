const logger = require('../utils/logger');
const cache = require('../utils/cache');

class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.maxSessions = 100; // Limite sessioni simultanee
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 ore
        
        // Avvia pulizia automatica sessioni
        this.startSessionCleanup();
    }

    // Crea nuova sessione
    createSession(userId, authData) {
        try {
            // Rimuovi sessione esistente se presente
            if (this.sessions.has(userId)) {
                this.destroySession(userId);
            }

            const session = {
                userId: userId,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                authData: authData,
                requests: 0,
                errors: 0
            };

            this.sessions.set(userId, session);
            
            // Salva anche in cache persistente
            cache.setAuth(userId, session);
            
            logger.info(`Session created for user: ${userId}`);
            
            // Enforza limite massimo sessioni
            this.enforceSesssionLimit();
            
            return session;

        } catch (error) {
            logger.logError(error, 'createSession');
            return null;
        }
    }

    // Ottieni sessione utente
    getSession(userId) {
        try {
            let session = this.sessions.get(userId);
            
            // Se non in memoria, prova dalla cache
            if (!session) {
                session = cache.getAuth(userId);
                if (session) {
                    this.sessions.set(userId, session);
                }
            }

            if (session) {
                // Verifica se è scaduta
                if (this.isSessionExpired(session)) {
                    this.destroySession(userId);
                    return null;
                }

                // Aggiorna ultimo accesso
                session.lastAccessed = Date.now();
                this.sessions.set(userId, session);
                cache.setAuth(userId, session);
            }

            return session;

        } catch (error) {
            logger.logError(error, 'getSession');
            return null;
        }
    }

    // Aggiorna dati sessione
    updateSession(userId, updates) {
        try {
            const session = this.getSession(userId);
            if (!session) return false;

            Object.assign(session, updates);
            session.lastAccessed = Date.now();

            this.sessions.set(userId, session);
            cache.setAuth(userId, session);

            return true;

        } catch (error) {
            logger.logError(error, 'updateSession');
            return false;
        }
    }

    // Incrementa contatore richieste
    incrementRequests(userId) {
        const session = this.getSession(userId);
        if (session) {
            session.requests = (session.requests || 0) + 1;
            session.lastAccessed = Date.now();
            this.sessions.set(userId, session);
        }
    }

    // Incrementa contatore errori
    incrementErrors(userId) {
        const session = this.getSession(userId);
        if (session) {
            session.errors = (session.errors || 0) + 1;
            session.lastAccessed = Date.now();
            this.sessions.set(userId, session);
        }
    }

    // Verifica se sessione è scaduta
    isSessionExpired(session) {
        if (!session || !session.createdAt) return true;
        
        const age = Date.now() - session.createdAt;
        return age > this.sessionTimeout;
    }

    // Verifica se sessione è valida
    isSessionValid(userId) {
        const session = this.getSession(userId);
        return session && !this.isSessionExpired(session);
    }

    // Distruggi sessione
    destroySession(userId) {
        try {
            const session = this.sessions.get(userId);
            if (session) {
                logger.info(`Session destroyed for user: ${userId}`, {
                    duration: Date.now() - session.createdAt,
                    requests: session.requests || 0,
                    errors: session.errors || 0
                });
            }

            this.sessions.delete(userId);
            cache.getAuth(userId) && cache.delete(`auth_${userId}`);

            return true;

        } catch (error) {
            logger.logError(error, 'destroySession');
            return false;
        }
    }

    // Ottieni tutte le sessioni attive
    getActiveSessions() {
        const active = [];
        const now = Date.now();

        for (const [userId, session] of this.sessions) {
            if (!this.isSessionExpired(session)) {
                active.push({
                    userId: userId,
                    age: now - session.createdAt,
                    lastAccessed: now - session.lastAccessed,
                    requests: session.requests || 0,
                    errors: session.errors || 0
                });
            }
        }

        return active;
    }

    // Statistiche sessioni
    getSessionStats() {
        const now = Date.now();
        let totalSessions = 0;
        let activeSessions = 0;
        let expiredSessions = 0;
        let totalRequests = 0;
        let totalErrors = 0;

        for (const [userId, session] of this.sessions) {
            totalSessions++;
            totalRequests += session.requests || 0;
            totalErrors += session.errors || 0;

            if (this.isSessionExpired(session)) {
                expiredSessions++;
            } else {
                activeSessions++;
            }
        }

        return {
            total: totalSessions,
            active: activeSessions,
            expired: expiredSessions,
            totalRequests: totalRequests,
            totalErrors: totalErrors,
            memoryUsage: this.getMemoryUsage()
        };
    }

    // Stima utilizzo memoria delle sessioni
    getMemoryUsage() {
        let size = 0;
        
        for (const [userId, session] of this.sessions) {
            size += userId.length * 2; // UTF-16
            size += JSON.stringify(session).length * 2;
        }

        return Math.round(size / 1024) + ' KB';
    }

    // Pulisci sessioni scadute
    cleanupExpiredSessions() {
        let cleaned = 0;
        const now = Date.now();

        for (const [userId, session] of this.sessions) {
            if (this.isSessionExpired(session)) {
                this.destroySession(userId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.info(`Session cleanup: removed ${cleaned} expired sessions`);
        }

        return cleaned;
    }

    // Applica limite massimo sessioni
    enforceSesssionLimit() {
        if (this.sessions.size <= this.maxSessions) return;

        // Ordina per ultimo accesso (meno recenti prima)
        const entries = Array.from(this.sessions.entries());
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        // Rimuovi le più vecchie
        const toRemove = entries.slice(0, this.sessions.size - this.maxSessions);
        
        for (const [userId] of toRemove) {
            this.destroySession(userId);
        }

        if (toRemove.length > 0) {
            logger.info(`Session limit enforced: removed ${toRemove.length} old sessions`);
        }
    }

    // Avvia pulizia automatica
    startSessionCleanup() {
        const interval = 5 * 60 * 1000; // Ogni 5 minuti

        setInterval(() => {
            this.cleanupExpiredSessions();
        }, interval);

        logger.info(`Session auto-cleanup started (every ${interval}ms)`);
    }

    // Esporta sessioni (per backup/debug)
    exportSessions() {
        const exported = {};
        
        for (const [userId, session] of this.sessions) {
            exported[userId] = {
                ...session,
                authData: '***REDACTED***' // Non esportare dati sensibili
            };
        }

        return exported;
    }

    // Importa sessioni (per restore)
    importSessions(sessionsData) {
        try {
            let imported = 0;

            for (const [userId, sessionData] of Object.entries(sessionsData)) {
                if (sessionData && !this.isSessionExpired(sessionData)) {
                    this.sessions.set(userId, sessionData);
                    imported++;
                }
            }

            logger.info(`Sessions imported: ${imported}`);
            return imported;

        } catch (error) {
            logger.logError(error, 'importSessions');
            return 0;
        }
    }

    // Metodi helper per autenticazione

    // Verifica se utente è autenticato
    isAuthenticated(userId) {
        return this.isSessionValid(userId);
    }

    // Ottieni dati autenticazione
    getAuthData(userId) {
        const session = this.getSession(userId);
        return session ? session.authData : null;
    }

    // Aggiorna dati autenticazione
    updateAuthData(userId, authData) {
        return this.updateSession(userId, { authData });
    }

    // Rate limiting semplice
    canMakeRequest(userId, maxRequests = 100, timeWindow = 60000) {
        const session = this.getSession(userId);
        if (!session) return true;

        const now = Date.now();
        const windowStart = now - timeWindow;

        // Reset counter se finestra scaduta
        if (!session.requestWindow || session.requestWindow < windowStart) {
            session.requestWindow = now;
            session.requestCount = 0;
        }

        return (session.requestCount || 0) < maxRequests;
    }

    // Registra richiesta per rate limiting  
    recordRequest(userId) {
        const session = this.getSession(userId);
        if (session) {
            session.requestCount = (session.requestCount || 0) + 1;
            this.incrementRequests(userId);
        }
    }
}

module.exports = new SessionManager();