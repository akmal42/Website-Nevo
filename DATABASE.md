# Database Setup

This project now uses MongoDB for production storage, with `data/store.json` only as a local development fallback.

## What Gets Stored In MongoDB

The backend stores one `nevo-store` document containing:

- Products added from admin.
- Customer login/profile data.
- Carts and wishlists.
- Orders.
- Payment status and payment event logs.
- Newsletter signups.
- Order notification logs.

This keeps the MVP simple while still avoiding browser-only storage for ecommerce data. Later, the same document can be split into dedicated MongoDB collections such as `products`, `users`, `orders`, `payments`, and `newsletter_signups`.

## MongoDB Environment Variables

Add these to `.env` locally or to your hosting provider:

```text
DATABASE_PROVIDER=mongodb
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nevo_wear
MONGODB_DATABASE=nevo_wear
MONGODB_COLLECTION=app_store
REQUIRE_DATABASE=true
```

With `REQUIRE_DATABASE=true`, the server will not store data locally and will fail fast if MongoDB is missing.

## Install Dependency

Run once:

```bash
npm install
```

This installs the `mongodb` driver from `package.json`.

## Check

After restart:

```text
http://localhost:3000/api/health
```

You should see:

```json
"database": "mongodb"
```

If you see `"database": "local-json"`, MongoDB is not connected yet or `REQUIRE_DATABASE` is set to `false`.

## Recommended Hosted MongoDB Provider

- MongoDB Atlas
