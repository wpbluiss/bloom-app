#!/bin/bash
# Vendors the watercolor week illustrations from the public Supabase bucket
# into assets/illustrations/ so they can be committed to the repo.
# Afterwards: swap lib/illustrations.local.ts in for lib/illustrations.ts,
# then commit the PNGs + the module swap.
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="https://olqryrntsxglehxyahzf.supabase.co/storage/v1/object/public/illustrations"
mkdir -p assets/illustrations
for i in $(seq 4 40); do
  f=$(printf "week-%02d.png" "$i")
  curl -fsSL "$BASE/$f" -o "assets/illustrations/$f"
  echo "vendored $f"
done
echo "Done. Now: cp lib/illustrations.local.ts lib/illustrations.ts && git add assets/illustrations lib/illustrations.ts"
