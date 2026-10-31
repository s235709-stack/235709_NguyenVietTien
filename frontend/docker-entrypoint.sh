#!/bin/sh
cat > /usr/share/nginx/html/config.js <<EOF
window.APP_CONFIG = { API_URL: "${API_URL:-http://localhost:5000}" };
EOF