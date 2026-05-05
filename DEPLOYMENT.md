# Go-Live Notes

## What is live-ready now

- A Node backend serves the website and API.
- Products can be added from `/admin.html`.
- Users are collected when they log in from profile.
- Newsletter/phone leads are collected from the popup.
- Cart and wishlist are saved server-side.
- Orders are created during checkout.
- Payment status is saved on each order.
- Razorpay signature verification is implemented on the backend.
- MongoDB storage is supported for non-local data.
- Gmail and WhatsApp order notification hooks are implemented.

## What you must provide

You need real business/vendor accounts and secrets:

- Razorpay account and API keys.
- MongoDB Atlas database connection string.
- Gmail app password or WhatsApp Cloud API credentials.
- Hosting provider account, for example Render, Railway, VPS, AWS, or DigitalOcean.
- Domain name.
- Business legal pages: privacy policy, terms, refund/return policy.

## Recommended deployment

1. Push the folder to GitHub.
2. Create a Render web service from the repo.
3. Add environment variables from `.env.example`.
4. Set `BASE_URL` to the Render URL or your domain.
5. Set `DATABASE_PROVIDER=mongodb`.
6. Set `MONGODB_URI` from MongoDB Atlas.
7. Set `REQUIRE_DATABASE=true`.
8. Add Gmail or WhatsApp notification credentials if you want order alerts.
9. Deploy.
10. Test Razorpay with test keys.
11. Switch Razorpay dashboard to Live Mode and add live keys.

## Database note

For go-live, this project should persist data to MongoDB using `MONGODB_URI`. Local `data/store.json` is only for development fallback and should not be used for real orders.

The app stores MVP state in one MongoDB document named `nevo-store`. For larger scale, split it into collections for products, users, orders, payments, carts, wishlists, and notifications.

## MongoDB Setup

You can use MongoDB Atlas.

Steps:

1. Create a MongoDB Atlas cluster.
2. Create a database user and password.
3. Allow your hosting server IP address to connect, or use the provider-recommended allowlist during testing.
4. Copy the MongoDB connection string.
5. Add it as `MONGODB_URI` in your hosting environment variables.
6. Set `DATABASE_PROVIDER=mongodb`.
7. Set `MONGODB_DATABASE=nevo_wear`.
8. Set `MONGODB_COLLECTION=app_store`.
9. Set `REQUIRE_DATABASE=true`.
10. Restart/redeploy the server.
11. Visit `/api/health` and confirm:

```json
{
  "database": "mongodb"
}
```
