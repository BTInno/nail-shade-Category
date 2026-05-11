#!/usr/bin/env node
/*
  migrate-nail-shape.js
  Reads a CSV of product identifiers and nail_shape values and prints curl commands to set product metafields.

  CSV format (header): product_id,nail_shape

  Usage (dry-run):
    node scripts/migrate-nail-shape.js scripts/nail-shape-sample.csv

  To actually run writes, set these env vars:
    SHOP_NAME
    SHOPIFY_ADMIN_TOKEN

  The script is intentionally conservative: by default it prints commands instead of executing them.
*/

const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2] || path.join(__dirname, 'nail-shape-sample.csv');

if (!fs.existsSync(csvPath)) {
  console.error('CSV file not found:', csvPath);
  process.exit(1);
}

const csv = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);

console.log('Found', csv.length, 'rows in', csvPath);

const SHOP = process.env.SHOP_NAME;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

csv.forEach((line, idx) => {
  const [product_id, nail_shape] = line.split(',').map(s => s && s.trim());
  if (!product_id || !nail_shape) return;

  const body = {
    metafield: {
      namespace: 'shopify',
      key: 'nail_shape',
      // For compatibility we write the value as a string. If using a single_select metafield definition,
      // Shopify expects specific types; adjust as needed when performing real writes.
      value: nail_shape,
      type: 'single_line_text_field'
    }
  };

  if (!SHOP || !TOKEN) {
    console.log(`\n[DRY] Product ${product_id} -> set nail_shape=${nail_shape}`);
    console.log('curl -X POST https://{shop}.myshopify.com/admin/api/2024-01/products/' + product_id + '/metafields.json \\');
    console.log("  -H 'Content-Type: application/json' \\");
    console.log("  -H 'X-Shopify-Access-Token: {access_token}' \\");
    console.log("  -d '" + JSON.stringify(body) + "'\n");
  } else {
    console.log(`\nProduct ${product_id} -> would write metafield with value '${nail_shape}'`);
    // Not executing writes automatically to avoid accidental changes. If you want this script to perform writes,
    // I can add a flag and implement fetch/curl execution.
  }
});
