#!/bin/bash
# Script para detener Keycloak
# Uso: bash scripts/stop-keycloak.sh

echo "🛑 Deteniendo Keycloak..."

docker-compose --env-file .env.keycloak -f docker-compose.keycloak.yml down

echo "✅ Keycloak detenido"

