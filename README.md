# Nevo Wear Ecommerce MVP

This project now includes:

- Storefront with products, search, wishlist, cart, checkout, profile.
- Backend API in `server.js`.
- Admin dashboard at `/admin.html`.
- Product add/hide from admin.
- Order creation and order status updates.
- Customer/login/newsletter data collection.
- Razorpay-ready payment order and payment signature verification.
- MongoDB production storage.
- Gmail and WhatsApp order notification hooks.
- Demo payment mode when Razorpay keys are not configured.

## Run Locally

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Admin:

```text
http://localhost:3000/admin.html
```

Default local admin:

```text
admin@nevowear.test
admin12345
```

Change this in `.env` before any public deployment.

## Data Storage

For go-live with MongoDB, set these values in `.env` or your hosting provider:

```text
DATABASE_PROVIDER=mongodb
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nevo_wear
MONGODB_DATABASE=nevo_wear
MONGODB_COLLECTION=app_store
REQUIRE_DATABASE=true
```

When MongoDB is configured, the backend stores all ecommerce data in MongoDB:

- `products`
- `users`
- `carts`
- `wishlists`
- `orders`
- `newsletter`
- `paymentEvents`
- `notifications`

`data/store.json` is now only a local development fallback when `REQUIRE_DATABASE=false`.

## Order Notifications

Gmail SMTP notifications are enabled when these variables are set:

```text
GMAIL_USER=yourstore@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
ORDER_NOTIFY_EMAIL_TO=orders@yourdomain.com
```

WhatsApp Cloud API notifications are enabled when these variables are set:

```text
WHATSAPP_ACCESS_TOKEN=replace-with-meta-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=replace-with-whatsapp-phone-number-id
ORDER_NOTIFY_WHATSAPP_TO=919876543210
```

If `ORDER_NOTIFY_WHATSAPP_TO` is blank, the checkout phone number is used.

## Razorpay Payments

1. Copy `.env.example` to `.env`.
2. Add Razorpay test keys:

```text
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

3. Restart the server.
4. Checkout will open Razorpay.
5. Backend verifies payment using:

```text
POST /api/payments/razorpay/verify
```

If keys are missing, checkout uses demo payment mode and marks the order paid locally.

## Main API Routes

- `GET /api/products`
- `POST /api/auth/login`
- `GET /api/cart`
- `POST /api/cart/items`
- `POST /api/payments/razorpay/order`
- `POST /api/payments/razorpay/verify`
- `POST /api/payments/demo/complete`
- `GET /api/orders`
- `POST /api/newsletter`
- `POST /api/admin/login`
- `GET /api/admin/dashboard`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id`
- `GET /api/admin/customers`

## Go-Live Checklist

- Set strong `.env` values.
- Use Razorpay test mode first.
- Add Razorpay live keys only after test checkout passes.
- Configure Razorpay webhook to `/api/webhooks/razorpay`.
- Use HTTPS hosting.
- Replace default admin password.
- Back up `data/store.json`, or migrate to a managed database before serious traffic.
- For production, set `DATABASE_PROVIDER=mongodb`, `MONGODB_URI`, and `REQUIRE_DATABASE=true` so nothing is stored locally.
- Add business policies: shipping, return, privacy, terms.
- Add domain and analytics.
