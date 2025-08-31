const videoExtractor = require('./video-extractor');

module.exports = async function streamHandler(args) {
    try {
        const streams = await videoExtractor(args.id);
        return { streams };
    } catch (err) {
        console.error('Errore stream RaiPlay:', err);
        return { streams: [] };
    }
};
