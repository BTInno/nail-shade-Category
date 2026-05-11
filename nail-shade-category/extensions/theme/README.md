Nail Shape Filter — Theme App Extension
=====================================

This folder contains the Theme App Extension skeleton for the Nail Shape Filter block.

Contents
- `block.schema.json` — block schema used by the theme editor.
- `block.liquid` — block output that injects a container and includes assets.
- `assets/filter-widget.js` — front-end widget that renders the UI and filters DOM products.
- `assets/filter-widget.css` — widget styles.
- `shopify.extension.toml` — minimal extension metadata.

How to preview locally (developer)
----------------------------------
1. Install and login to Shopify CLI if not already installed.
2. From your app root run the CLI dev server which serves app + extensions:

```bash
shopify app dev
```

3. Open the development store and go to Theme Editor. Add the `Nail Shape Filter` block to a collection template.
4. Ensure your product card templates output the `data-nail-shape` attribute so the widget can filter client-side:

```liquid
<div class="product-card" data-product-id="{{ product.id }}" data-nail-shape="{{ product.metafields.shopify.nail_shape }}">
  <!-- product markup -->
</div>
```

Notes
- If your theme does not output product metafields into the product cards, the widget will not be able to filter the DOM. In that case implement a small Liquid change as shown above or use a backend proxy / Storefront API to fetch product metafields.
- To publish an extension to a partner account or push changes, use the Shopify CLI extension commands (`shopify extension build`, `shopify extension push`) or consult Shopify CLI docs for your version.
