const { addonBuilder } = require("stremio-addon-sdk");
const videoExtractor = require("./stream/video-extractor"); // il tuo helper per estrarre stream

const manifest = {
    id: "org.raiplay",
    version: "1.0.0",
    name: "RaiPlay Addon",
    resources: ["stream"],
    types: ["tv", "movie"]
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
    try {
        // usa video-extractor per ottenere i link reali
        const streams = await videoExtractor(id);

        // streams deve essere un array di oggetti { title, url, isFree }
        return { streams };
    } catch (err) {
        console.error("Errore stream RaiPlay:", err);
        return { streams: [] };
    }
});

module.exports = builder.getInterface();
