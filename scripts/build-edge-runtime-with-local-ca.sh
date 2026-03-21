#!/usr/bin/env bash

set -euo pipefail

CA_FILE="${1:-}"
EDGE_RUNTIME_IMAGE="${2:-public.ecr.aws/supabase/edge-runtime:v1.71.0}"

if [[ -z "${CA_FILE}" ]]; then
  echo "Usage: bash scripts/build-edge-runtime-with-local-ca.sh <ca-pem-path> [edge-runtime-image]" >&2
  exit 1
fi

if [[ ! -f "${CA_FILE}" ]]; then
  echo "CA file not found: ${CA_FILE}" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "${TMP_DIR}"
}

trap cleanup EXIT

cp "${CA_FILE}" "${TMP_DIR}/corporate-ca.crt"

cat > "${TMP_DIR}/Dockerfile" <<EOF
FROM ${EDGE_RUNTIME_IMAGE}

COPY corporate-ca.crt /usr/local/share/ca-certificates/corporate-ca.crt

RUN chmod 0644 /usr/local/share/ca-certificates/corporate-ca.crt \\
  && update-ca-certificates

ENV DENO_TLS_CA_STORE=system
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
EOF

docker build -t "${EDGE_RUNTIME_IMAGE}" "${TMP_DIR}"

echo "Built local Edge Runtime override for ${EDGE_RUNTIME_IMAGE}."
echo "Restart Supabase to pick it up:"
echo "  supabase stop"
echo "  supabase start"
