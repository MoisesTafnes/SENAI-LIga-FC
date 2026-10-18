#!/bin/sh
set -e

echo "Executando migrações do banco de dados Prisma..."
npx prisma migrate deploy

echo "Iniciando servidor NestJS..."
exec node dist/main.js