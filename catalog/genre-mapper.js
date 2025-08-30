class GenreMapper {
    constructor() {
        // Mappature generi italiani -> standard Stremio
        this.genreMap = {
            // Generi principali
            'drammatico': 'Drama',
            'dramma': 'Drama',
            'commedia': 'Comedy',
            'thriller': 'Thriller',
            'giallo': 'Mystery',
            'horror': 'Horror',
            'fantasy': 'Fantasy',
            'fantascienza': 'Sci-Fi',
            'azione': 'Action',
            'avventura': 'Adventure',
            'romantico': 'Romance',
            'storico': 'History',
            'biografico': 'Biography',
            'documentario': 'Documentary',
            'animazione': 'Animation',
            'musicale': 'Musical',
            'western': 'Western',
            'guerra': 'War',
            'crimine': 'Crime',
            'poliziesco': 'Crime',
            
            // Generi TV specifici
            'talk show': 'Talk Show',
            'varietà': 'Variety',
            'reality': 'Reality',
            'game show': 'Game Show',
            'quiz': 'Game Show',
            'notiziario': 'News',
            'sport': 'Sport',
            'bambini': 'Kids',
            'cartoni': 'Animation',
            'cucina': 'Lifestyle',
            'viaggi': 'Travel',
            'natura': 'Nature',
            'scienza': 'Science',
            'cultura': 'Culture',
            'arte': 'Arts',
            'musica': 'Music',
            'teatro': 'Theatre',
            'opera': 'Opera',
            
            // Generi specifici RAI
            'fiction': 'Drama',
            'miniserie': 'Mini-Series',
            'serie tv': 'Series',
            'film tv': 'TV Movie',
            'inchiesta': 'Investigation',
            'approfondimento': 'Documentary',
            'intrattenimento': 'Entertainment',
            'satira': 'Comedy'
        };

        // Parole chiave per riconoscimento automatico
        this.keywords = {
            'Drama': ['drammatico', 'dramma', 'lacrime', 'tragico', 'emozionante', 'sentimentale'],
            'Comedy': ['commedia', 'divertente', 'comico', 'umoristico', 'ridere', 'satira'],
            'Thriller': ['thriller', 'suspense', 'tensione', 'mistero', 'brivido'],
            'Mystery': ['giallo', 'mistero', 'investigativo', 'poliziesco', 'detective'],
            'Horror': ['horror', 'paura', 'terrore', 'spaventoso', 'incubo'],
            'Action': ['azione', 'adrenalina', 'combattimento', 'inseguimento', 'esplosioni'],
            'Romance': ['romantico', 'amore', 'romanzo', 'sentimentale', 'passione'],
            'Documentary': ['documentario', 'inchiesta', 'reportage', 'approfondimento', 'realtà'],
            'History': ['storico', 'storia', 'epoca', 'periodo', 'passato'],
            'Biography': ['biografico', 'biografia', 'vita di', 'storia di'],
            'Kids': ['bambini', 'ragazzi', 'famiglia', 'cartoni', 'educativo'],
            'Science': ['scienza', 'scientifico', 'ricerca', 'scoperta', 'esperimento'],
            'Nature': ['natura', 'animali', 'ambiente', 'selvaggio', 'pianeta'],
            'Travel': ['viaggi', 'viaggio', 'destinazione', 'mondo', 'luoghi'],
            'Music': ['musica', 'musicale', 'concerto', 'cantante', 'orchestra'],
            'Sport': ['sport', 'calcio', 'tennis', 'olimpiadi', 'gara', 'campionato'],
            'News': ['notizie', 'informazione', 'giornale', 'attualità', 'cronaca'],
            'Culture': ['cultura', 'culturale', 'arte', 'letteratura', 'filosofia']
        };
    }

    // Mappa un genere italiano al corrispondente standard
    mapGenre(italianGenre) {
        if (!italianGenre) return null;
        
        const normalized = italianGenre.toLowerCase().trim();
        return this.genreMap[normalized] || null;
    }

    // Estrae generi da un testo (titolo + descrizione)
    extractGenresFromText(text) {
        if (!text || typeof text !== 'string') return [];

        const foundGenres = new Set();
        const normalizedText = text.toLowerCase();

        // Cerca parole chiave nei testi
        for (const [genre, keywords] of Object.entries(this.keywords)) {
            for (const keyword of keywords) {
                if (normalizedText.includes(keyword)) {
                    foundGenres.add(genre);
                    break; // Basta una parola chiave per genere
                }
            }
        }

        // Converti Set in Array e limita a massimo 3 generi
        return Array.from(foundGenres).slice(0, 3);
    }

    // Normalizza array di generi
    normalizeGenres(genres) {
        if (!Array.isArray(genres)) return [];

        const normalized = [];
        
        for (const genre of genres) {
            if (typeof genre === 'string') {
                const mapped = this.mapGenre(genre);
                if (mapped && !normalized.includes(mapped)) {
                    normalized.push(mapped);
                }
            }
        }

        return normalized;
    }

    // Combina generi da diverse fonti
    combineGenres(...genreSources) {
        const combined = new Set();

        for (const source of genreSources) {
            if (Array.isArray(source)) {
                for (const genre of this.normalizeGenres(source)) {
                    combined.add(genre);
                }
            } else if (typeof source === 'string') {
                const extracted = this.extractGenresFromText(source);
                for (const genre of extracted) {
                    combined.add(genre);
                }
            }
        }

        return Array.from(combined).slice(0, 3); // Max 3 generi
    }

    // Ottiene genere principale (più probabile)
    getPrimaryGenre(text, existingGenres = []) {
        const textGenres = this.extractGenresFromText(text);
        const normalizedExisting = this.normalizeGenres(existingGenres);
        
        // Priorità: generi esistenti, poi da testo
        if (normalizedExisting.length > 0) {
            return normalizedExisting[0];
        }
        
        if (textGenres.length > 0) {
            return textGenres[0];
        }

        return 'Entertainment'; // Fallback
    }

    // Suggerisce generi basati su pattern comuni RAI
    suggestRaiGenres(title, description = '', programType = '') {
        const text = `${title} ${description} ${programType}`.toLowerCase();
        const genres = [];

        // Pattern specifici RAI
        if (text.includes('fiction') || text.includes('serie')) {
            if (text.includes('poliziesco') || text.includes('commissario') || text.includes('maresciallo')) {
                genres.push('Crime', 'Drama');
            } else if (text.includes('medico') || text.includes('ospedale')) {
                genres.push('Drama', 'Medical');
            } else if (text.includes('storico') || text.includes('guerra')) {
                genres.push('History', 'Drama');
            } else {
                genres.push('Drama');
            }
        }

        if (text.includes('varietà') || text.includes('festival') || text.includes('sanremo')) {
            genres.push('Variety', 'Music');
        }

        if (text.includes('ulisse') || text.includes('piero angela') || text.includes('superquark')) {
            genres.push('Documentary', 'Science');
        }

        if (text.includes('porta a porta') || text.includes('vespa') || text.includes('politica')) {
            genres.push('News', 'Talk Show');
        }

        if (text.includes('ballando') || text.includes('tale e quale') || text.includes('talent')) {
            genres.push('Entertainment', 'Variety');
        }

        // Combina con estrazione automatica
        const autoGenres = this.extractGenresFromText(text);
        
        return [...new Set([...genres, ...autoGenres])].slice(0, 3);
    }

    // Valida se un genere è supportato da Stremio
    isValidStremioGenre(genre) {
        const validGenres = [
            'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 
            'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 
            'Music', 'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 
            'Western', 'News', 'Talk Show', 'Game Show', 'Variety', 'Reality',
            'Kids', 'Educational', 'Lifestyle', 'Travel', 'Nature', 'Science',
            'Arts', 'Culture', 'Entertainment'
        ];

        return validGenres.includes(genre);
    }

    // Pulisce e valida generi per Stremio
    cleanGenresForStremio(genres) {
        if (!Array.isArray(genres)) return [];

        return genres
            .map(genre => typeof genre === 'string' ? genre.trim() : null)
            .filter(genre => genre && this.isValidStremioGenre(genre))
            .slice(0, 3); // Stremio funziona meglio con max 3 generi
    }
}

module.exports = new GenreMapper();