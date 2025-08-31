const videoExtractor = require('./video-extractor');

module.exports = async function streamHandler(args) {
    try {
        // args.id potrebbe essere tipo "movie:1234" da TMDb
        // qui puoi mappare gli ID TMDb a RaiPlay reali se vuoi
        const streams = await videoExtractor(args.id);
        return { streams };
    } catch (err) {
        console.error('Errore stream RaiPlay:', err);
        return { streams: [] };
    }
};
