const manifest = {
    id: 'com.raiplay.stremio.addon',
    version: '1.2.0',
    name: 'RaiPlay Italiano',
    description: 'Accedi a tutti i contenuti RaiPlay direttamente su Stremio - Serie TV, Film, Documentari e Programmi',
    logo: 'https://www.rai.it/dl/images/2021/12/17/1639751569406_rai-play.png',
    background: 'https://www.raiplay.it/cropgd/1920x1080/dl/img-logos/LOGORAI_sfondoNERO.jpg',
    
    // Risorse supportate
    resources: [
        'catalog',
        'stream',
        'meta'
    ],
    
    // Tipi di contenuto
    types: [
        'movie',
        'series',
        'channel'
    ],
    
    // Cataloghi disponibili
    catalogs: [
        // Serie TV
        {
            type: 'series',
            id: 'raiplay_series_popolari',
            name: 'Serie TV Popolari',
            extra: [
                { name: 'genre', options: ['all', 'drammatico', 'commedia', 'thriller', 'giallo', 'storico'] },
                { name: 'skip', options: ['0'] }
            ]
        },
        {
            type: 'series',
            id: 'raiplay_series_nuove',
            name: 'Nuove Serie',
            extra: [
                { name: 'skip', options: ['0'] }
            ]
        },
        {
            type: 'series',
            id: 'raiplay_fiction_rai',
            name: 'Fiction RAI',
            extra: [
                { name: 'genre', options: ['all', 'drammatico', 'commedia', 'giallo', 'storico'] },
                { name: 'skip', options: ['0'] }
            ]
        },
        
        // Film
        {
            type: 'movie',
            id: 'raiplay_film_cinema',
            name: 'Cinema Italiano',
            extra: [
                { name: 'genre', options: ['all', 'drammatico', 'commedia', 'thriller', 'biografico', 'storico'] },
                { name: 'skip', options: ['0'] }
            ]
        },
        {
            type: 'movie',
            id: 'raiplay_film_tv',
            name: 'Film per la TV',
            extra: [
                { name: 'genre', options: ['all', 'drammatico', 'commedia', 'biografico'] },
                { name: 'skip', options: ['0'] }
            ]
        },
        {
            type: 'movie',
            id: 'raiplay_documentari',
            name: 'Documentari',
            extra: [
                { name: 'genre', options: ['all', 'natura', 'storia', 'scienza', 'arte', 'viaggi'] },
                { name: 'skip', options: ['0'] }
            ]
        },
        
        // Programmi TV
        {
            type: 'series',
            id: 'raiplay_programmi_intrattenimento',
            name: 'Intrattenimento',
            extra: [
                { name: 'skip', options: ['0'] }
            ]
        },
        {
            type: 'series',
            id: 'raiplay_programmi_bambini',
            name: 'Programmi per Bambini',
            extra: [
                { name: 'skip', options: ['0'] }
            ]
        },
        {
            type: 'series',
            id: 'raiplay_programmi_culturali',
            name: 'Programmi Culturali',
            extra: [
                { name: 'skip', options: ['0'] }
            ]
        },
        
        // Canali Live
        {
            type: 'channel',
            id: 'raiplay_live',
            name: 'Canali RAI Live',
            extra: [
                { name: 'skip', options: ['0'] }
            ]
        }
    ],
    
    // Configurazioni per l'autenticazione
    behaviorHints: {
        adult: false,
        p2p: false,
        configurable: true,
        configurationRequired: false
    },
    
    // Parametri di configurazione per l'utente
    config: [
        {
            key: 'raiplay_email',
            type: 'text',
            title: 'Email RaiPlay (opzionale)',
            required: false
        },
        {
            key: 'raiplay_password',
            type: 'password', 
            title: 'Password RaiPlay (opzionale)',
            required: false
        },
        {
            key: 'quality_preference',
            type: 'select',
            title: 'Qualità Video Preferita',
            options: ['auto', 'hd', 'sd'],
            default: 'auto',
            required: false
        },
        {
            key: 'enable_subtitles',
            type: 'boolean',
            title: 'Abilita Sottotitoli quando disponibili',
            default: true,
            required: false
        }
    ]
};

module.exports = manifest;
