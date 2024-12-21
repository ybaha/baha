#!/bin/bash
# Only run Prisma generate in production
if [ "$NODE_ENV" = "production" ]; then
  npx prisma generate
  npx prisma db push --accept-data-loss
fi 