const { addonBuilder } = require("stremio-addon-sdk");
const fetch = require("node-fetch");

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
        const jsonUrl = `https://www.raiplay.it/video/${id}.html?json`;
        const res = await fetch(jsonUrl);
        const data = await res.json();

        const streams = [];
        if (data && data.video && data.video.sources) {
            data.video.sources.forEach(source => {
                if (source.url && (source.url.endsWith(".m3u8") || source.url.endsWith(".mpd"))) {
                    streams.push({
                        title: "RaiPlay Stream",
                        url: source.url,
                        isFree: true
                    });
                }
            });
        }

        return { streams };
    } catch (err) {
        console.error("Errore stream RaiPlay:", err);
        return { streams: [] };
    }
});

module.exports = builder.getInterface();
