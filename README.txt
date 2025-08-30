# Stremio RaiPlay Addon 🇮🇹

Un addon completo per accedere a tutti i contenuti RaiPlay direttamente su Stremio.

## ✨ Caratteristiche

- 📺 **Serie TV e Fiction RAI** - Tutte le serie TV e fiction italiane
- 🎬 **Film del Cinema e TV** - Cinema italiano e film per la televisione  
- 📖 **Documentari** - Natura, storia, scienza, arte e cultura
- 👶 **Programmi per bambini** - Cartoni e programmi educativi
- 🎪 **Intrattenimento** - Varietà, talk show e programmi culturali
- 📡 **Canali Live** - Tutti i canali RAI in diretta
- 🔐 **Autenticazione opzionale** - Login per contenuti premium
- 🌐 **Sottotitoli** - Supporto sottotitoli quando disponibili

## 🚀 Installazione Rapida

### Deploy su Render (Consigliato)

1. Fork questo repository
2. Collegalo a [Render.com](https://render.com)
3. Crea un nuovo Web Service
4. Imposta:
   - **Build Command**: `npm install`
   - **Start Command**: `./start.sh`
5. Deploy completato! 

### Installazione Locale

```bash
# Clona il repository
git clone https://github.com/tuonome/stremio-raiplay-addon.git
cd stremio-raiplay-addon

# Installa dipendenze
npm install

# Avvia in sviluppo
npm run dev

# Oppure in produzione
npm start
```

## 📱 Aggiungere a Stremio

1. Apri Stremio
2. Vai su **Add-ons** → **Community Add-ons**  
3. Incolla l'URL del tuo addon:
   ```
   https://tuo-addon.onrender.com/manifest.json
   ```
4. Clicca **Install**

## ⚙️ Configurazione

### Autenticazione RaiPlay (Opzionale)

Per accedere a contenuti premium o per evitare limitazioni:

1. Registrati su [RaiPlay](https://www.raiplay.it)
2. Nell'URL dell'addon, aggiungi le credenziali encodate in Base64:
   ```
   https://tuo-addon.onrender.com/configure/eyJyYWlwbGF5X2VtYWlsIjoidHVhQGVtYWlsLmNvbSIsInJhaXBsYXlfcGFzc3dvcmQiOiJ0dWFwYXNzd29yZCJ9/manifest.json
   ```

### Generare configurazione:

```javascript
// Converti le tue credenziali
const config = {
  raiplay_email: "tua@email.com", 
  raiplay_password: "tuapassword",
  quality_preference: "hd",
  enable_subtitles: true
};

const encoded = btoa(JSON.stringify(config));
console.log(`/${encoded}/manifest.json`);
```

## 📊 Monitoraggio

### Health Check
```bash
curl https://tuo-addon.onrender.com/health
```

### Statistiche
```bash
curl https://tuo-addon.onrender.com/stats
```

### Log in tempo reale
```bash
npm run logs
```

## 🐛 Risoluzione Problemi

### Stream non funzionano
- Verifica che l'addon sia accessibile pubblicamente
- Controlla i log per errori di autenticazione
- RaiPlay potrebbe bloccare IP non italiani (usa VPN)

### Cataloghi vuoti  
- Verifica la connessione internet
- RaiPlay potrebbe aver cambiato le API
- Controlla i log per errori HTTP

### Errori di autenticazione
- Verifica email/password RaiPlay
- Controlla che l'account non sia bloccato
- Le sessioni scadono dopo 24 ore

## 🔧 Configurazione Avanzata

### Variabili d'ambiente

```bash
# .env file
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN=*

# RaiPlay settings
RAIPLAY_TIMEOUT=15000
CACHE_TIMEOUT=3600000
```

### Configurazione Cache

```javascript
// utils/config.js
cache: {
  timeout: {
    catalog: 3600000,    // 1 ora
    stream: 300000,      // 5 minuti  
    meta: 1800000,       // 30 minuti
    auth: 86400000       // 24 ore
  }
}
```

## 📝 API Endpoints

- `GET /manifest.json` - Manifest dell'addon
- `GET /catalog/{type}/{id}` - Cataloghi
- `GET /stream/{type}/{id}` - Stream video
- `GET /health` - Health check
- `GET /stats` - Statistiche 
- `POST /admin/clear-cache` - Pulizia cache

## 🤝 Contribuire

1. Fork il progetto
2. Crea un branch (`git checkout -b feature/nuova-feature`)
3. Commit le modifiche (`git commit -am 'Aggiunge nuova feature'`)
4. Push al branch (`git push origin feature/nuova-feature`)
5. Apri una Pull Request

## ⚖️ Note Legali

Questo addon è solo per uso personale. Rispetta i termini di servizio di RaiPlay:
- Non ridistribuire contenuti protetti
- Usa solo per contenuti pubblicamente disponibili
- Rispetta le limitazioni geografiche

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli.

## 🎯 Roadmap

- [ ] Supporto episodi serie TV
- [ ] Ricerca avanzata  
- [ ] Cache persistente
- [ ] Metadati IMDb
- [ ] Notifiche nuovi contenuti
- [ ] App mobile companion

## 📞 Supporto

- 🐛 [Segnala bug](https://github.com/tuonome/stremio-raiplay-addon/issues)
- 💡 [Richiedi feature](https://github.com/tuonome/stremio-raiplay-addon/issues/new)
- 💬 [Discussioni](https://github.com/tuonome/stremio-raiplay-addon/discussions)

---

⭐ **Se l'addon ti è utile, lascia una stella al repository!**