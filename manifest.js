module.exports = {
  id: "com.raiplay.stremio.addon",
  version: "2.0.0",
  name: "RaiPlay Italiano",
  description: "Accedi a tutti i contenuti RaiPlay direttamente su Stremio con ricerca libera",
  logo: "https://www.rai.it/dl/images/2021/12/17/1639751569406_rai-play.png",
  background: "https://www.raiplay.it/cropgd/1920x1080/dl/img-logos/LOGORAI_sfondoNERO.jpg",
  resources: ["catalog", "stream", "meta"],
  types: ["movie", "series"],
  catalogs: [
    {
      type: "series",
      id: "raiplay_search",
      name: "RaiPlay (Ricerca)",
      extra: [{ name: "search", isRequired: true }]
    }
  ],
  behaviorHints: {
    adult: false,
    p2p: false,
    configurable: true,
    configurationRequired: false
  }
};
