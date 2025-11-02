#!/bin/bash
export DATABASE_URL="postgresql://postgres:XFy9lNaZnEnPLKLC@db.vfpdnjqxxtmmpbcnhqsw.supabase.co:5432/postgres"
npx prisma db push --skip-generate --accept-data-loss
