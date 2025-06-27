#!/bin/bash
set -e

if [ -f server/package.json ]; then
  echo "Installing server dependencies..."
  (cd server && npm install || true)
fi

if [ -f client/package.json ]; then
  echo "Installing client dependencies..."
  (cd client && npm install || true)
fi

if [ ! -f .env.example ]; then
  cat <<'EOT' > .env.example
# Example environment variables
PORT=3000
EOT
fi

echo "Setup completed"
