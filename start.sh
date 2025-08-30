#!/bin/bash

echo "🚀 Avvio Stremio RaiPlay Addon..."

# Imposta variabili d'ambiente
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

echo "⚙️  Configurazione:"
echo "   - NODE_ENV: $NODE_ENV"
echo "   - PORT: $PORT"

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato"
    exit 1
fi

echo "📦 Node.js versione: $(node --version)"

# Verifica file principale
if [ ! -f "server-ultra-simple.js" ]; then
    echo "❌ File server-ultra-simple.js non trovato"
    exit 1
fi

echo "✅ Tutti i file necessari presenti"

# Avvia l'applicazione
echo "🎬 Avvio server sulla porta $PORT..."
node server-ultra-simple.js
