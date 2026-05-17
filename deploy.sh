#!/bin/bash
# Professional ASIX Deployment Script
set -e

echo "[*] Starting Deployment Process..."

# Ensure we are in the script directory
cd "$(dirname "$0")"

# Load environment variables
if [ -f .env ]; then
    echo "[*] Loading .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "[-] WARNING: .env file not found. Using defaults or environment variables."
fi

echo "[*] Pulling latest images..."
docker compose pull

echo "[*] Building services..."
docker compose build --no-cache

echo "[*] Bringing down existing containers..."
docker compose down

echo "[*] Starting services in detached mode..."
docker compose up -d

echo "[*] Checking health status..."
sleep 5
docker compose ps

echo "[+] Deployment successful!"
