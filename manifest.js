module.exports = {
  id: "com.raiplay.stremio.addon",
  version: "1.2.0",
  name: "RaiPlay Italiano",
  description: "Accedi a tutti i contenuti RaiPlay direttamente su Stremio - Serie TV, Film, Documentari e Programmi",
  logo: "https://www.rai.it/dl/images/2021/12/17/1639751569406_rai-play.png",
  background: "https://www.raiplay.it/cropgd/1920x1080/dl/img-logos/LOGORAI_sfondoNERO.jpg",
  resources: ["catalog", "stream", "meta"],
  types: ["movie", "series", "channel"],
  catalogs: [
    {
      type: "series",
      id: "raiplay_series_popolari",
      name: "Serie TV Popolari",
      extra: [
        { name: "genre", options: ["all", "drammatico", "commedia", "thriller", "giallo", "storico"] },
        { name: "skip", options: ["0"] }
      ]
    },
    {
      type: "movie",
      id: "raiplay_film_cinema",
      name: "Cinema Italiano",
      extra: [
        { name: "genre", options: ["all", "drammatico", "commedia", "thriller", "biografico", "storico"] },
        { name: "skip", options: ["0"] }
      ]
    },
    {
      type: "channel",
      id: "raiplay_live",
      name: "Canali RAI Live",
      extra: [
        { name: "skip", options: ["0"] }
      ]
    }
  ],
  behaviorHints: {
    adult: false,
    p2p: false,
    configurable: true,
    configurationRequired: false
  },
  idPrefixes: ["tt"]
};
