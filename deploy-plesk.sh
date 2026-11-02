#!/bin/sh
set -e

# Try to run npm build if available outside chroot; otherwise use pre-built 'out/' from git
for dir in /opt/plesk/node/*/bin "$HOME/.nvm/versions/node"/*/bin /usr/local/bin /usr/bin; do
  if [ -x "$dir/npm" ]; then
    export PATH="$dir:$PATH"
    break
  fi
done

if command -v npm >/dev/null 2>&1; then
  echo "NPM found, building fresh bundle..."
  npm install --no-audit --no-fund
  npm run build
else
  echo "Running in Plesk chrooted Git shell (no npm in chroot). Using pre-built 'out/' bundle from repository."
fi

# Copy static export to root if needed and trigger Passenger restart
mkdir -p tmp
touch tmp/restart.txt

echo "Deploy & restart completed successfully!"
