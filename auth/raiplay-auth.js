const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class RaiPlayAuth {
    constructor() {
        this.baseUrl = 'https://www.raiplay.it';
        this.loginUrl = 'https://www.raiplay.it/login';
        this.apiLoginUrl = 'https://www.raiplay.it/api/login';
        this.sessions = new Map(); // Gestione sessioni multiple utenti
    }

    // Headers standard per le richieste
    getHeaders(sessionCookies = '') {
        return {
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
            'Cache-Control': 'max-age=0',
            'Cookie': sessionCookies,
            'Referer': 'https://www.raiplay.it/',
            'Origin': 'https://www.raiplay.it'
        };
    }

    // Login con email e password
    async login(email, password, userId = 'default') {
        try {
            logger.info(`Tentativo di login per utente: ${userId}`);

            // Step 1: Ottieni la pagina di login per i token CSRF
            const loginPageResponse = await axios.get(this.loginUrl, {
                headers: this.getHeaders(),
                timeout: 10000
            });

            const $ = cheerio.load(loginPageResponse.data);
            
            // Estrai token CSRF se presente
            let csrfToken = null;
            $('meta[name="csrf-token"]').each((i, el) => {
                csrfToken = $(el).attr('content');
            });

            // Estrai cookies di sessione
            const setCookieHeader = loginPageResponse.headers['set-cookie'] || [];
            const sessionCookies = setCookieHeader.map(cookie => 
                cookie.split(';')[0]
            ).join('; ');

            // Step 2: Effettua il login
            const loginData = {
                email: email,
                password: password
            };

            // Aggiungi token CSRF se trovato
            if (csrfToken) {
                loginData._token = csrfToken;
            }

            const loginHeaders = {
                ...this.getHeaders(sessionCookies),
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };

            // Se c'è un token CSRF, aggiungilo anche negli headers
            if (csrfToken) {
                loginHeaders['X-CSRF-TOKEN'] = csrfToken;
            }

            const loginResponse = await axios.post(this.apiLoginUrl, loginData, {
                headers: loginHeaders,
                timeout: 15000,
                maxRedirects: 0,
                validateStatus: status => status < 400
            });

            // Step 3: Gestisci la risposta del login
            if (loginResponse.status === 200 || loginResponse.status === 302) {
                // Combina i cookies della sessione
                const newSetCookies = loginResponse.headers['set-cookie'] || [];
                const allCookies = [...setCookieHeader, ...newSetCookies];
                const finalCookies = allCookies.map(cookie => 
                    cookie.split(';')[0]
                ).join('; ');

                // Salva la sessione
                const session = {
                    userId: userId,
                    email: email,
                    cookies: finalCookies,
                    loginTime: Date.now(),
                    isAuthenticated: true,
                    userAgent: loginHeaders['User-Agent']
                };

                this.sessions.set(userId, session);
                logger.info(`Login successful per utente: ${userId}`);

                return {
                    success: true,
                    session: session,
                    message: 'Login effettuato con successo'
                };
            } else {
                throw new Error(`Login failed with status: ${loginResponse.status}`);
            }

        } catch (error) {
            logger.error(`Errore durante il login per ${userId}: ${error.message}`);
            
            return {
                success: false,
                error: error.message,
                message: 'Errore durante il login. Verifica le credenziali.'
            };
        }
    }

    // Verifica se l'utente è autenticato
    isAuthenticated(userId = 'default') {
        const session = this.sessions.get(userId);
        if (!session || !session.isAuthenticated) {
            return false;
        }

        // Verifica se la sessione è scaduta (24 ore)
        const sessionAge = Date.now() - session.loginTime;
        const maxAge = 24 * 60 * 60 * 1000; // 24 ore

        if (sessionAge > maxAge) {
            this.sessions.delete(userId);
            return false;
        }

        return true;
    }

    // Ottieni la sessione dell'utente
    getSession(userId = 'default') {
        return this.sessions.get(userId);
    }

    // Headers autenticati per le richieste API
    getAuthenticatedHeaders(userId = 'default') {
        const session = this.getSession(userId);
        if (!session) {
            return this.getHeaders();
        }

        return {
            ...this.getHeaders(session.cookies),
            'User-Agent': session.userAgent
        };
    }

    // Logout
    async logout(userId = 'default') {
        try {
            const session = this.getSession(userId);
            if (session) {
                // Effettua logout su RaiPlay se necessario
                await axios.post('https://www.raiplay.it/api/logout', {}, {
                    headers: this.getAuthenticatedHeaders(userId),
                    timeout: 5000
                }).catch(() => {}); // Ignora errori di logout
                
                this.sessions.delete(userId);
                logger.info(`Logout effettuato per utente: ${userId}`);
            }
            
            return { success: true };
        } catch (error) {
            logger.error(`Errore durante logout: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // Verifica e rinnova sessione se necessario
    async refreshSession(userId = 'default') {
        const session = this.getSession(userId);
        if (!session) {
            return false;
        }

        try {
            // Testa la sessione con una richiesta semplice
            const testResponse = await axios.get('https://www.raiplay.it/api/user', {
                headers: this.getAuthenticatedHeaders(userId),
                timeout: 5000
            });

            if (testResponse.status === 200) {
                // Aggiorna il timestamp della sessione
                session.loginTime = Date.now();
                this.sessions.set(userId, session);
                return true;
            }
        } catch (error) {
            logger.warn(`Sessione scaduta per utente ${userId}: ${error.message}`);
            this.sessions.delete(userId);
        }

        return false;
    }

    // Ottieni informazioni utente
    async getUserInfo(userId = 'default') {
        if (!this.isAuthenticated(userId)) {
            return null;
        }

        try {
            const response = await axios.get('https://www.raiplay.it/api/user', {
                headers: this.getAuthenticatedHeaders(userId),
                timeout: 5000
            });

            return response.data;
        } catch (error) {
            logger.error(`Errore nel recupero info utente: ${error.message}`);
            return null;
        }
    }

    // Cleanup sessioni scadute
    cleanupExpiredSessions() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 ore

        for (const [userId, session] of this.sessions) {
            if (now - session.loginTime > maxAge) {
                this.sessions.delete(userId);
                logger.info(`Sessione scaduta rimossa per utente: ${userId}`);
            }
        }
    }
}

module.exports = new RaiPlayAuth();