#!/usr/bin/env bash
set -e

# Add Plesk Node.js binaries to PATH automatically (supports Node 18, 20, 22, 24, 26)
for dir in /opt/plesk/node/*/bin; do
  if [ -d "$dir" ]; then
    export PATH="$dir:$PATH"
  fi
done

echo "Installing dependencies..."
npm install --no-audit --no-fund

echo "Building Next.js application..."
npm run build

echo "Restarting Phusion Passenger / Plesk Node.js app..."
mkdir -p tmp
touch tmp/restart.txt

echo "Deploy completed successfully!"
