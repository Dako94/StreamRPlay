#!/bin/bash

# Script di avvio per Render.com
echo "🚀 Avvio Stremio RaiPlay Addon..."

# Imposta variabili d'ambiente se non esistono
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export LOG_LEVEL=${LOG_LEVEL:-info}

# Verifica che Node.js sia installato
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato. Installazione richiesta."
    exit 1
fi

# Verifica versione Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2)
echo "📦 Node.js versione: $NODE_VERSION"

# Installa dipendenze se non presenti (per sicurezza)
if [ ! -d "node_modules" ]; then
    echo "📥 Installazione dipendenze..."
    npm ci --only=production
fi

# Verifica che tutti i file necessari esistano
REQUIRED_FILES=(
    "server.js"
    "manifest.js"
    "auth/raiplay-auth.js"
    "catalog/catalog-handler.js"
    "stream/stream-handler.js"
    "utils/config.js"
    "utils/cache.js"
    "utils/logger.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ File mancante: $file"
        exit 1
    fi
done

echo "✅ Tutti i file necessari sono presenti"

# Crea cartelle di log se necessarie
mkdir -p logs

# Imposta permessi per i file di log
touch logs/app.log logs/error.log
chmod 644 logs/*.log

# Pulizia cache se necessaria
if [ "$CLEAR_CACHE" = "true" ]; then
    echo "🧹 Pulizia cache..."
    rm -rf cache/*
fi

# Controllo salute pre-avvio
echo "🏥 Controllo salute sistema..."

# Verifica memoria disponibile
MEMORY=$(free -m | grep '^Mem:' | awk '{print $7}' 2>/dev/null || echo "N/A")
if [ "$MEMORY" != "N/A" ] && [ "$MEMORY" -lt 100 ]; then
    echo "⚠️  Attenzione: Memoria disponibile bassa ($MEMORY MB)"
fi

# Verifica spazio disco
DISK=$(df -h . | tail -1 | awk '{print $4}' 2>/dev/null || echo "N/A")
echo "💾 Spazio disco disponibile: $DISK"

# Mostra configurazione
echo "⚙️  Configurazione:"
echo "   - NODE_ENV: $NODE_ENV"
echo "   - PORT: $PORT"
echo "   - LOG_LEVEL: $LOG_LEVEL"
echo "   - PID: $$"

# Gestione segnali per shutdown graceful
trap 'echo "🛑 Ricevuto segnale di shutdown..."; kill -TERM $NODE_PID; wait $NODE_PID; echo "✅ Shutdown completato"; exit 0' SIGTERM SIGINT

# Avvia l'applicazione
echo "🎬 Avvio server RaiPlay Addon sulla porta $PORT..."

# Controlla se dobbiamo usare PM2 per la produzione
if [ "$NODE_ENV" = "production" ] && command -v pm2 &> /dev/null; then
    echo "🔄 Avvio con PM2..."
    pm2 start server.js --name "raiplay-addon" --max-memory-restart 500M
    pm2 logs raiplay-addon --follow
else
    # Avvio standard con Node.js
    node server.js &
    NODE_PID=$!
    
    # Attendi il processo
    wait $NODE_PID
fi