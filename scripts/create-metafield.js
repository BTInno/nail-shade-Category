#!/usr/bin/env node
/*
  create-metafield.js
  Generates a Metafield Definition payload for `shopify.nail_shape` and prints instructions.

  Usage (preview):
    node scripts/create-metafield.js

  To actually send a request, set these env vars before running:
    SHOP_NAME (e.g. my-shop)
    SHOPIFY_ADMIN_TOKEN (Admin API access token)

*/

const definition = {
  namespace: 'shopify',
  key: 'nail_shape',
  name: 'Nail Shape',
  description: 'Product nail shape used for collection filtering',
  type: 'single_select',
  ownerType: 'PRODUCT',
  options: [
    { value: 'super_short', label: 'SUPER SHORT' },
    { value: 'oval', label: 'OVAL' },
    { value: 'almond', label: 'ALMOND' },
    { value: 'squoval', label: 'SQUOVAL' },
    { value: 'round', label: 'ROUND' },
    { value: 'coffin', label: 'COFFIN' }
  ]
};

console.log('=== Metafield definition preview ===\n');
console.log(JSON.stringify(definition, null, 2));

if (!process.env.SHOP_NAME || !process.env.SHOPIFY_ADMIN_TOKEN) {
  console.log('\nTo create this metafield definition automatically, set the environment variables:');
  console.log('  SHOP_NAME and SHOPIFY_ADMIN_TOKEN');
  console.log('\nAlternatively, create it manually in Shopify Admin:');
  console.log('  Admin -> Settings -> Custom data -> Products -> Add definition');
  process.exit(0);
}

console.log('\nEnvironment variables detected. This script currently prints the payload only.');
console.log('If you want, I can extend this script to POST the GraphQL mutation to the Admin API.');
