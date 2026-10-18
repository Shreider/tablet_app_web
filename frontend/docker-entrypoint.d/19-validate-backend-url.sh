#!/bin/sh
set -eu

# BACKEND_URL is an origin; Nginx forwards the original /api path unchanged.
case "${BACKEND_URL:-}" in
  http://*) backend_authority=${BACKEND_URL#http://} ;;
  https://*) backend_authority=${BACKEND_URL#https://} ;;
  *) echo >&2 'BACKEND_URL must start with http:// or https://'; exit 1 ;;
esac

if ! printf '%s' "$backend_authority" | grep -Eq '^([[:alnum:]_.-]+|\[[[:xdigit:]:.]+\])(:[0-9]+)?$'; then
  echo >&2 'BACKEND_URL must contain only the server address and optional port, without a path or trailing /'
  exit 1
fi
