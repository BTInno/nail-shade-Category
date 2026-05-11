# Admin UI (placeholder)

This folder will contain admin UI for managing nail-shape option labels, icons and running migration scripts.

For now, migration is performed via `scripts/migrate-nail-shape.js` and metafield definition preview via `scripts/create-metafield.js`.

Next steps to implement Admin UI:
- React/Polaris pages under `web/frontend/admin/` that call server endpoints to run migrations and save option metadata.
- Endpoints in `server/` to perform authenticated Admin API requests.
