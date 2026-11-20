#!/usr/bin/env bash
set -euo pipefail

# Usage: bash mongodb/import_all.sh [mongodb_uri] [database]
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
URI="${1:-mongodb://127.0.0.1:27017}"
DB="${2:-smart_order_hub}"
for file in *.json; do
  mongoimport --uri "$URI" --db "$DB" --collection "${file%.json}" --file "$file" --jsonArray --drop --stopOnError
done
SOH_IMPORT_DATABASE="$DB" mongosh "$URI" --eval 'db = db.getSiblingDB(process.env.SOH_IMPORT_DATABASE); load("create_indexes.js");'
