const http = require("http");
const https = require("https");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = process.env.DATA_FILE || path.join(DATA_DIR, "store.json");

loadEnv();

const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const STORE_NAME = process.env.STORE_NAME || "Nevo Wear";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-secret-before-live";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@nevowear.test").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const DATABASE_PROVIDER = (process.env.DATABASE_PROVIDER || "").toLowerCase();
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || "nevo_wear";
const MONGODB_COLLECTION = String(process.env.MONGODB_COLLECTION || "app_store").replace(/[^a-zA-Z0-9_]/g, "");
const REQUIRE_DATABASE = process.env.REQUIRE_DATABASE === "true";
const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";
const ORDER_NOTIFY_EMAIL_TO = process.env.ORDER_NOTIFY_EMAIL_TO || "";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v19.0";
const ORDER_NOTIFY_WHATSAPP_TO = process.env.ORDER_NOTIFY_WHATSAPP_TO || "";

let mongoClientPromise = null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const seedProducts = [
  productSeed("linen-shirt-white", "Solid Linen Blend Shirt", "Slim fit | Solid", "White", ["clothing", "new"], "Nevo Essentials", 1559, 2599, "40% OFF", "Exclusive", 4.6, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=85"),
  productSeed("graphic-tee-off-white", "Oversized Graphic T-Shirt", "Oversized | Printed", "Off White", ["clothing", "new"], "Nevo Studio", 719, 1199, "40% OFF", "New Drop", 4.5, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=85"),
  productSeed("textured-polo-olive", "Textured Casual Polo T-Shirt", "Olive | Slim fit", "Olive", ["clothing"], "Nevo Essentials", 1319, 2199, "40% OFF", "", 4.7, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?auto=format&fit=crop&w=700&q=85"),
  productSeed("oxford-shirt-sky", "Oxford Button Down Shirt", "Regular fit | Cotton", "Sky Blue", ["clothing"], "Nevo Essentials", 1299, 2199, "41% OFF", "", 4.6, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=85"),
  productSeed("black-basic-crew-tee", "Core Crew Neck T-Shirt", "Regular fit | Solid", "Black", ["clothing"], "Nevo Basics", 599, 999, "40% OFF", "Daily Wear", 4.4, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=700&q=85"),
  productSeed("resort-print-shirt", "Resort Printed Shirt", "Relaxed fit | Printed", "Navy", ["clothing", "new"], "Nevo Studio", 1399, 2499, "44% OFF", "New Drop", 4.5, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=700&q=85"),
  productSeed("flannel-overshirt-navy", "Checked Flannel Overshirt", "Relaxed | Layering", "Navy Check", ["clothing"], "Nevo Studio", 1799, 2999, "40% OFF", "", 4.7, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=700&q=85"),
  productSeed("waffle-knit-tee-sage", "Waffle Knit T-Shirt", "Textured | Relaxed", "Sage", ["clothing"], "Nevo Basics", 899, 1499, "40% OFF", "", 4.5, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1618354691438-25bc04584c23?auto=format&fit=crop&w=700&q=85"),
  productSeed("relaxed-denim-shirt", "Relaxed Denim Shirt", "Washed | Button down", "Mid Blue", ["clothing"], "Nevo Denim", 1699, 2799, "39% OFF", "Bestseller", 4.6, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=85"),
  productSeed("camp-collar-shirt-cream", "Camp Collar Shirt", "Resort fit | Soft touch", "Cream", ["clothing", "new"], "Nevo Studio", 1499, 2499, "40% OFF", "New Drop", 4.5, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1604695573706-53170668f6a6?auto=format&fit=crop&w=700&q=85"),
  productSeed("longline-tee-charcoal", "Longline Cotton T-Shirt", "Long fit | Heavy cotton", "Charcoal", ["clothing"], "Nevo Basics", 799, 1299, "38% OFF", "", 4.4, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=700&q=85"),
  productSeed("pique-polo-navy", "Pique Polo T-Shirt", "Classic collar | Breathable", "Navy", ["clothing"], "Nevo Essentials", 1199, 1999, "40% OFF", "", 4.6, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=700&q=85"),
  productSeed("striped-tee-rust", "Striped Everyday T-Shirt", "Regular fit | Yarn dyed", "Rust Stripe", ["clothing"], "Nevo Basics", 699, 1199, "42% OFF", "", 4.3, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=700&q=85"),
  productSeed("utility-overshirt-sand", "Utility Pocket Overshirt", "Layering | Utility", "Sand", ["clothing", "new"], "Nevo Studio", 1999, 3299, "39% OFF", "Fresh", 4.7, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&w=700&q=85"),
  productSeed("premium-henley-forest", "Premium Henley T-Shirt", "Button neck | Soft cotton", "Forest", ["clothing"], "Nevo Essentials", 999, 1699, "41% OFF", "", 4.5, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=700&q=85"),
  productSeed("corduroy-trouser-brown", "Corduroy Carpenter Trouser", "Loose fit | Solid", "Brown", ["bottomwear"], "Nevo Studio", 1499, 2999, "50% OFF", "Exclusive", 5, ["30", "32", "34", "36"], "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=700&q=85"),
  productSeed("straight-joggers-olive", "Straight Fit Joggers", "Straight fit | Cotton", "Olive", ["bottomwear", "new"], "Nevo Essentials", 1549, 2599, "40% OFF", "", 4.8, ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=85"),
  productSeed("slim-fit-denim-blue", "Slim Fit Denim Jeans", "Slim fit | Heavy fade", "Blue", ["bottomwear", "new"], "Nevo Essentials", 1679, 2799, "40% OFF", "", 4.5, ["30", "32", "34", "36"], "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=85"),
  productSeed("tapered-jeans-indigo", "Tapered Stretch Jeans", "Tapered fit | Stretch", "Indigo", ["bottomwear"], "Nevo Denim", 1899, 3199, "41% OFF", "Bestseller", 4.6, ["30", "32", "34", "36"], "https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?auto=format&fit=crop&w=700&q=85"),
  productSeed("relaxed-cargo-trouser", "Relaxed Cargo Trouser", "Utility pockets | Cotton", "Stone", ["bottomwear"], "Nevo Studio", 1599, 2699, "41% OFF", "", 4.4, ["30", "32", "34", "36"], "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=85"),
  productSeed("stretch-chino-khaki", "Stretch Chino Trouser", "Slim tapered | Stretch", "Khaki", ["bottomwear"], "Nevo Essentials", 1499, 2499, "40% OFF", "", 4.3, ["30", "32", "34", "36"], "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=700&q=85"),
  productSeed("avenue-runner-sneakers", "Avenue Runner Sneakers", "White | Grey", "Lighttag", ["footwear", "new"], "Nevo Kicks", 2099, 4199, "50% OFF", "", 4.5, ["7", "8", "9", "10"], "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=85"),
  productSeed("everyday-sliders-black", "Everyday Sliders", "Black | Comfort sole", "Black", ["footwear"], "Nevo Kicks", 999, 1699, "41% OFF", "", 4.3, ["7", "8", "9", "10"], "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=700&q=85"),
  productSeed("studio-heel-beige", "Studio Heel", "Nude | Studio finish", "Soft Beige", ["footwear"], "Nevo Studio", 2990, 4999, "40% OFF", "Bestseller", 4.6, ["5", "6", "7", "8"], "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=85"),
  productSeed("court-white-sneaker", "Court White Sneakers", "White | Low top", "White", ["footwear"], "Nevo Kicks", 1799, 2999, "40% OFF", "Daily Wear", 4.6, ["7", "8", "9", "10", "11"], "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=700&q=85"),
  productSeed("trail-knit-sneaker", "Trail Knit Sneakers", "Cushion sole | Sport", "Charcoal", ["footwear", "new"], "Nevo Kicks", 2399, 3999, "40% OFF", "New Drop", 4.7, ["7", "8", "9", "10", "11"], "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=700&q=85"),
  productSeed("suede-loafer-tan", "Suede Penny Loafers", "Slip-on | Suede", "Tan", ["footwear"], "Nevo Studio", 2199, 3699, "41% OFF", "", 4.4, ["7", "8", "9", "10"], "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=700&q=85"),
  productSeed("chunky-sole-sneaker-cream", "Chunky Sole Sneakers", "Cream | Sculpted sole", "Cream", ["footwear", "new"], "Nevo Kicks", 2499, 4299, "42% OFF", "Fresh", 4.6, ["6", "7", "8", "9", "10"], "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=700&q=85"),
  productSeed("leather-sandal-brown", "Leather Strap Sandals", "Cushioned | Leather", "Brown", ["footwear"], "Nevo Studio", 1599, 2699, "41% OFF", "", 4.4, ["6", "7", "8", "9", "10"], "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=700&q=85"),
  productSeed("platform-sneaker-blush", "Platform Sneakers", "Blush | Elevated sole", "Blush", ["footwear"], "Nevo Kicks", 2299, 3799, "39% OFF", "Bestseller", 4.7, ["5", "6", "7", "8"], "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=700&q=85"),
  productSeed("canvas-low-top-navy", "Canvas Low Top Sneakers", "Canvas | Everyday", "Navy", ["footwear"], "Nevo Basics", 1299, 2199, "41% OFF", "", 4.3, ["7", "8", "9", "10", "11"], "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=700&q=85"),
  productSeed("monsoon-rubber-clogs", "Monsoon Rubber Clogs", "Water friendly | Lightweight", "Olive", ["footwear", "new"], "Nevo Kicks", 899, 1499, "40% OFF", "New Drop", 4.2, ["6", "7", "8", "9", "10"], "https://images.unsplash.com/photo-1603808033587-935942847de4?auto=format&fit=crop&w=700&q=85"),
  productSeed("derby-formal-black", "Derby Formal Lace-Ups", "Polished | Lace-up", "Black", ["footwear"], "Nevo Studio", 2799, 4599, "39% OFF", "", 4.6, ["7", "8", "9", "10"], "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=700&q=85"),
  productSeed("knit-slip-on-grey", "Knit Slip-On Sneakers", "Breathable | Flexible", "Grey", ["footwear"], "Nevo Kicks", 1899, 3199, "41% OFF", "", 4.5, ["7", "8", "9", "10", "11"], "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=700&q=85"),
  productSeed("high-top-sneaker-green", "High Top Sneakers", "Canvas | Street fit", "Green", ["footwear"], "Nevo Studio", 2199, 3699, "41% OFF", "", 4.4, ["7", "8", "9", "10"], "https://images.unsplash.com/photo-1605408499391-6368c628ef42?auto=format&fit=crop&w=700&q=85"),
  productSeed("comfort-mule-taupe", "Comfort Mules", "Slip-on | Soft footbed", "Taupe", ["footwear"], "Nevo Essentials", 1399, 2299, "39% OFF", "", 4.3, ["5", "6", "7", "8", "9"], "https://images.unsplash.com/photo-1626947346165-4c2288dadc2a?auto=format&fit=crop&w=700&q=85")
];

const defaultStore = {
  products: seedProducts,
  users: [],
  sessions: {},
  adminSessions: {},
  carts: {},
  wishlists: {},
  orders: [],
  newsletter: [],
  paymentEvents: [],
  notifications: []
};

function loadEnv() {
  try {
    const envPath = path.join(ROOT, ".env");
    require("fs").readFileSync(envPath, "utf8").split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const index = trimmed.indexOf("=");
      if (index === -1) return;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    });
  } catch {
    // .env is optional.
  }
}

function productSeed(id, name, subtitle, detail, category, brand, price, mrp, discount, badge, rating, sizes, image) {
  return {
    id,
    name,
    subtitle,
    detail,
    category,
    brand,
    price,
    mrp,
    discount,
    deal: `Launch Deal: ${money(Math.round(price * 0.9))}`,
    rating,
    badge,
    sizes,
    image,
    stock: 25,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function ensureStore() {
  if (useMongoDb()) {
    const collection = await getMongoCollection();
    const doc = await collection.findOne({ _id: "nevo-store" });
    let store = doc?.data;
    if (!store) {
      store = JSON.parse(JSON.stringify(defaultStore));
      await saveStore(store);
    }
    if (typeof store === "string") store = JSON.parse(store);
    store = normalizeStore(store);
    await saveStore(store);
    return store;
  }

  if (REQUIRE_DATABASE) {
    throw new Error("MongoDB database is required. Set MONGODB_URI before starting the server.");
  }

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const store = normalizeStore(JSON.parse(raw));
    await saveStore(store);
    return store;
  } catch {
    const store = normalizeStore(defaultStore);
    await saveStore(store);
    return JSON.parse(JSON.stringify(store));
  }
}

async function saveStore(store) {
  if (useMongoDb()) {
    const collection = await getMongoCollection();
    await collection.updateOne(
      { _id: "nevo-store" },
      { $set: { data: store, updatedAt: new Date() } },
      { upsert: true }
    );
    return;
  }

  if (REQUIRE_DATABASE) {
    throw new Error("MongoDB database is required. Set MONGODB_URI before saving data.");
  }

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function normalizeStore(inputStore) {
  const store = { ...defaultStore, ...(inputStore || {}) };
  for (const key of Object.keys(defaultStore)) {
    if (store[key] === undefined) store[key] = defaultStore[key];
  }

  const existingProducts = Array.isArray(store.products) ? store.products : [];
  const cleanProducts = existingProducts.map((product) => ({
    ...product,
    category: normalizeCategories(product.category)
  })).filter((product) => {
    const categories = Array.isArray(product.category) ? product.category : String(product.category || "").split(",");
    return !categories.some((category) => ["cosmetics", "beauty"].includes(String(category).trim().toLowerCase()));
  });
  const productsById = new Map(cleanProducts.map((product) => [product.id, product]));
  seedProducts.forEach((product) => {
    const existing = productsById.get(product.id);
    productsById.set(product.id, existing ? { ...product, createdAt: existing.createdAt || product.createdAt, updatedAt: product.updatedAt } : product);
  });
  store.products = Array.from(productsById.values());
  store.notifications = Array.isArray(store.notifications) ? store.notifications : [];
  return store;
}

function normalizeCategories(category) {
  const categories = Array.isArray(category) ? category : String(category || "clothing").split(",");
  return categories
    .map((item) => {
      const value = String(item).trim().toLowerCase();
      if (value === "shoes") return "footwear";
      return value;
    })
    .filter(Boolean);
}

function useMongoDb() {
  return DATABASE_PROVIDER === "mongodb" || Boolean(MONGODB_URI);
}

async function getMongoCollection() {
  if (!MONGODB_COLLECTION) throw new Error("MONGODB_COLLECTION is invalid");
  if (!MONGODB_URI) throw new Error("MONGODB_URI is required for MongoDB storage");
  if (!mongoClientPromise) {
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(MONGODB_URI);
    mongoClientPromise = client.connect();
  }
  const client = await mongoClientPromise;
  return client.db(MONGODB_DATABASE).collection(MONGODB_COLLECTION);
}

function sendJson(res, status, data) {
  setSecurityHeaders(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function toPaise(value) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `product-${Date.now()}`;
}

function getAuthToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return "";
}

function getOwnerId(req, store) {
  const token = getAuthToken(req);
  if (token && store.sessions[token]) return store.sessions[token];
  const visitorId = String(req.headers["x-nevo-session"] || "guest").replace(/[^a-zA-Z0-9_-]/g, "");
  return `guest-${visitorId || "guest"}`;
}

function requireAdmin(req, store, res) {
  const admin = store.adminSessions[getAuthToken(req)];
  if (!admin) {
    sendError(res, 401, "Admin login required");
    return null;
  }
  return admin;
}

function createToken(prefix = "session") {
  return `${prefix}-${crypto.randomBytes(24).toString("hex")}`;
}

function safeCompare(a, b) {
  const left = crypto.createHash("sha256").update(String(a)).digest();
  const right = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    contact: user.contact,
    address: user.address || "",
    city: user.city || "",
    rewards: user.rewards || 450,
    status: "Nevo demo member",
    createdAt: user.createdAt
  };
}

function sanitizeProduct(input, existing = {}) {
  const name = String(input.name || existing.name || "").trim();
  if (!name) throw new Error("Product name is required");
  const category = normalizeCategories(input.category || existing.category || "clothing");
  const price = Number(input.price ?? existing.price ?? 0);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Valid product price is required");
  const now = new Date().toISOString();
  return {
    ...existing,
    id: existing.id || slugify(input.id || name),
    name,
    subtitle: String(input.subtitle || existing.subtitle || "Nevo Wear").trim(),
    detail: String(input.detail || existing.detail || "").trim(),
    category,
    brand: String(input.brand || existing.brand || "Nevo Wear").trim(),
    price,
    mrp: Number(input.mrp ?? existing.mrp ?? price),
    discount: String(input.discount || existing.discount || "New").trim(),
    deal: String(input.deal || existing.deal || `Launch Deal: ${money(Math.round(price * 0.9))}`).trim(),
    rating: Number(input.rating ?? existing.rating ?? 4.5),
    badge: String(input.badge || existing.badge || "").trim(),
    sizes: Array.isArray(input.sizes)
      ? input.sizes.map(String)
      : String(input.sizes || existing.sizes || "S,M,L,XL").split(",").map((item) => item.trim()).filter(Boolean),
    image: String(input.image || existing.image || "").trim(),
    stock: Number(input.stock ?? existing.stock ?? 10),
    active: input.active === undefined ? existing.active !== false : Boolean(input.active),
    createdAt: existing.createdAt || now,
    updatedAt: now
  };
}

function cartSummary(cart) {
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = Math.round(subtotal * 0.1);
  const total = Math.max(0, subtotal - discount);
  return {
    itemCount: cart.reduce((total, item) => total + item.quantity, 0),
    subtotal,
    discount,
    total,
    subtotalText: money(subtotal),
    discountText: `- ${money(discount)}`,
    totalText: money(total)
  };
}

function buildCartItem(product, quantity = 1, size = "M") {
  return {
    productId: product.id,
    name: product.name,
    subtitle: product.subtitle,
    price: product.price,
    image: product.image,
    quantity: Math.max(1, Number(quantity || 1)),
    size
  };
}

function publicProducts(store) {
  return store.products.filter((product) => product.active !== false);
}

function createLocalOrder(store, ownerId, cart, delivery, paymentProvider, paymentStatus = "pending") {
  const summary = cartSummary(cart);
  const order = {
    id: `NW${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`,
    ownerId,
    items: cart,
    summary,
    delivery: {
      name: String(delivery.name || "").trim(),
      phone: String(delivery.phone || "").trim(),
      address: String(delivery.address || "").trim()
    },
    status: paymentStatus === "paid" ? "Paid" : "Payment Pending",
    paymentStatus,
    paymentProvider,
    razorpayOrderId: "",
    razorpayPaymentId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.orders.push(order);
  return order;
}

function razorpayConfigured() {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

function createRazorpayOrder(amount, receipt, notes) {
  const body = JSON.stringify({
    amount: toPaise(amount),
    currency: "INR",
    receipt,
    notes
  });
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.razorpay.com",
      path: "/v1/orders",
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(parsed.error?.description || "Razorpay order failed"));
          else resolve(parsed);
        } catch {
          reject(new Error("Invalid Razorpay response"));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => req.destroy(new Error("Notification request timed out")));
    req.write(body);
    req.end();
  });
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  if (!RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeCompare(expected, signature);
}

function markOrderPaid(store, order, payment) {
  order.status = "Paid";
  order.paymentStatus = "paid";
  order.razorpayOrderId = payment.razorpay_order_id || order.razorpayOrderId || "";
  order.razorpayPaymentId = payment.razorpay_payment_id || order.razorpayPaymentId || "";
  order.updatedAt = new Date().toISOString();
  store.carts[order.ownerId] = [];
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function buildOrderNotificationMessage(order) {
  const items = (order.items || [])
    .map((item) => `${item.name} x ${item.quantity} (${item.size || "M"})`)
    .join(", ");
  return [
    `${STORE_NAME} order ${order.id}`,
    `Status: ${order.status}`,
    `Customer: ${order.delivery?.name || "Customer"}`,
    `Phone: ${order.delivery?.phone || "Not provided"}`,
    `Address: ${order.delivery?.address || "Not provided"}`,
    `Total: ${order.summary?.totalText || money(order.summary?.total)}`,
    `Items: ${items || "No items"}`
  ].join("\n");
}

function sendHttpsJson(options, payload) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request({
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 400) return reject(new Error(data || `Request failed with ${res.statusCode}`));
        resolve(data);
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function sendGmailOrderNotification(order, message) {
  const nodemailer = require("nodemailer");
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    }
  });
  await transport.sendMail({
    from: `${STORE_NAME} <${GMAIL_USER}>`,
    to: ORDER_NOTIFY_EMAIL_TO,
    subject: `${STORE_NAME} order ${order.id}`,
    text: message
  });
}

async function sendWhatsAppOrderNotification(order, message) {
  const to = normalizePhone(ORDER_NOTIFY_WHATSAPP_TO || order.delivery?.phone);
  if (!to) throw new Error("WhatsApp recipient phone is missing");
  await sendHttpsJson({
    hostname: "graph.facebook.com",
    path: `/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`
    }
  }, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: message
    }
  });
}

async function notifyOrderPlaced(store, order) {
  const message = buildOrderNotificationMessage(order);
  const channels = [];

  if (GMAIL_USER && GMAIL_APP_PASSWORD && ORDER_NOTIFY_EMAIL_TO) {
    try {
      await sendGmailOrderNotification(order, message);
      channels.push({ channel: "gmail", status: "sent", to: ORDER_NOTIFY_EMAIL_TO });
    } catch (error) {
      channels.push({ channel: "gmail", status: "failed", error: error.message });
    }
  }

  if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
    try {
      await sendWhatsAppOrderNotification(order, message);
      channels.push({ channel: "whatsapp", status: "sent", to: normalizePhone(ORDER_NOTIFY_WHATSAPP_TO || order.delivery?.phone) });
    } catch (error) {
      channels.push({ channel: "whatsapp", status: "failed", error: error.message });
    }
  }

  if (!channels.length) {
    channels.push({ channel: "none", status: "skipped", reason: "No Gmail or WhatsApp notification credentials configured" });
  }

  const event = { orderId: order.id, channels, createdAt: new Date().toISOString() };
  store.notifications.push(event);
  order.notification = event;
  return event;
}

async function handleApi(req, res, url) {
  const store = await ensureStore();
  const parts = url.pathname.split("/").filter(Boolean);
  const ownerId = getOwnerId(req, store);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      name: "Nevo Wear API",
      razorpayConfigured: razorpayConfigured(),
      database: useMongoDb() ? "mongodb" : "local-json",
      databaseRequired: REQUIRE_DATABASE,
      baseUrl: BASE_URL
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/products") {
    sendJson(res, 200, { products: publicProducts(store) });
    return;
  }

  if (req.method === "GET" && parts[1] === "products" && parts[2]) {
    const product = publicProducts(store).find((item) => item.id === parts[2]);
    product ? sendJson(res, 200, { product }) : sendError(res, 404, "Product not found");
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readBody(req);
    const name = String(body.name || "Demo User").trim() || "Demo User";
    const contact = String(body.contact || "").trim();
    let user = store.users.find((item) => item.contact && item.contact === contact);
    if (!user) {
      user = { id: `user-${crypto.randomUUID()}`, name, contact, address: "", city: "Mumbai, Maharashtra", rewards: 450, createdAt: new Date().toISOString() };
      store.users.push(user);
    } else {
      user.name = name;
      user.contact = contact;
    }
    const token = createToken("user");
    store.sessions[token] = user.id;
    store.carts[user.id] = store.carts[ownerId] || store.carts[user.id] || [];
    store.wishlists[user.id] = store.wishlists[ownerId] || store.wishlists[user.id] || [];
    await saveStore(store);
    sendJson(res, 200, { token, user: sanitizeUser(user) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/me") {
    const user = store.users.find((item) => item.id === store.sessions[getAuthToken(req)]);
    user ? sendJson(res, 200, { user: sanitizeUser(user) }) : sendError(res, 401, "Login required");
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/me") {
    const user = store.users.find((item) => item.id === store.sessions[getAuthToken(req)]);
    if (!user) return sendError(res, 401, "Login required");
    const body = await readBody(req);
    user.name = String(body.name || user.name).trim();
    user.contact = String(body.contact || user.contact).trim();
    user.address = String(body.address || user.address || "").trim();
    user.city = String(body.city || user.city || "").trim();
    await saveStore(store);
    sendJson(res, 200, { user: sanitizeUser(user) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/cart") {
    const cart = store.carts[ownerId] || [];
    sendJson(res, 200, { cart, summary: cartSummary(cart) });
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/cart") {
    const body = await readBody(req);
    const incoming = Array.isArray(body.cart) ? body.cart : [];
    store.carts[ownerId] = incoming.map((item) => {
      const product = publicProducts(store).find((entry) => entry.id === item.productId || entry.name === item.name);
      return product ? buildCartItem(product, item.quantity, item.size || "M") : null;
    }).filter(Boolean);
    await saveStore(store);
    sendJson(res, 200, { cart: store.carts[ownerId], summary: cartSummary(store.carts[ownerId]) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/cart/items") {
    const body = await readBody(req);
    const product = publicProducts(store).find((item) => item.id === body.productId);
    if (!product) return sendError(res, 404, "Product not found");
    if (product.stock <= 0) return sendError(res, 400, "Product is out of stock");
    const cart = store.carts[ownerId] || [];
    const existing = cart.find((item) => item.productId === product.id && item.size === (body.size || "M"));
    if (existing) existing.quantity += Number(body.quantity || 1);
    else cart.push(buildCartItem(product, body.quantity, body.size || "M"));
    store.carts[ownerId] = cart;
    await saveStore(store);
    sendJson(res, 200, { cart, summary: cartSummary(cart) });
    return;
  }

  if (req.method === "DELETE" && parts[1] === "cart" && parts[2] === "items" && parts[3]) {
    store.carts[ownerId] = (store.carts[ownerId] || []).filter((item) => item.productId !== parts[3]);
    await saveStore(store);
    sendJson(res, 200, { cart: store.carts[ownerId], summary: cartSummary(store.carts[ownerId]) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/wishlist") {
    sendJson(res, 200, { wishlist: store.wishlists[ownerId] || [] });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/wishlist") {
    const body = await readBody(req);
    const product = publicProducts(store).find((item) => item.id === body.productId);
    if (!product) return sendError(res, 404, "Product not found");
    const wishlist = store.wishlists[ownerId] || [];
    if (!wishlist.some((item) => item.productId === product.id)) wishlist.push(buildCartItem(product, 1, "M"));
    store.wishlists[ownerId] = wishlist;
    await saveStore(store);
    sendJson(res, 200, { wishlist });
    return;
  }

  if (req.method === "DELETE" && parts[1] === "wishlist" && parts[2]) {
    store.wishlists[ownerId] = (store.wishlists[ownerId] || []).filter((item) => item.productId !== parts[2]);
    await saveStore(store);
    sendJson(res, 200, { wishlist: store.wishlists[ownerId] });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/orders") {
    sendJson(res, 200, { orders: store.orders.filter((order) => order.ownerId === ownerId).slice(-10).reverse() });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders") {
    const body = await readBody(req);
    const cart = store.carts[ownerId] || [];
    if (!cart.length) return sendError(res, 400, "Cart is empty");
    const order = createLocalOrder(store, ownerId, cart, body, "manual", "paid");
    store.carts[ownerId] = [];
    await saveStore(store);
    await notifyOrderPlaced(store, order);
    await saveStore(store);
    sendJson(res, 201, { order, message: `Order ${order.id} placed successfully.` });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/payments/razorpay/order") {
    const body = await readBody(req);
    const cart = store.carts[ownerId] || [];
    if (!cart.length) return sendError(res, 400, "Cart is empty");
    const order = createLocalOrder(store, ownerId, cart, body, "razorpay", "pending");
    const summary = order.summary;
    let razorpayOrder = null;
    let mode = "demo";
    if (razorpayConfigured()) {
      razorpayOrder = await createRazorpayOrder(summary.total, order.id, { orderId: order.id, ownerId });
      order.razorpayOrderId = razorpayOrder.id;
      mode = "razorpay";
    } else {
      order.razorpayOrderId = `order_demo_${order.id}`;
    }
    await saveStore(store);
    sendJson(res, 201, {
      mode,
      order,
      checkout: {
        key: RAZORPAY_KEY_ID,
        amount: toPaise(summary.total),
        currency: "INR",
        name: STORE_NAME,
        description: `Order ${order.id}`,
        order_id: order.razorpayOrderId,
        prefill: { name: order.delivery.name, contact: order.delivery.phone }
      }
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/payments/razorpay/verify") {
    const body = await readBody(req);
    const order = store.orders.find((item) => item.id === body.orderId);
    if (!order) return sendError(res, 404, "Order not found");
    const isValid = verifyRazorpaySignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature);
    store.paymentEvents.push({ provider: "razorpay", orderId: order.id, event: isValid ? "verified" : "failed_verification", createdAt: new Date().toISOString() });
    if (!isValid) {
      order.paymentStatus = "failed";
      order.status = "Payment Failed";
      order.updatedAt = new Date().toISOString();
      await saveStore(store);
      return sendError(res, 400, "Payment signature verification failed");
    }
    markOrderPaid(store, order, body);
    await notifyOrderPlaced(store, order);
    await saveStore(store);
    sendJson(res, 200, { order, message: `Payment verified. Order ${order.id} is confirmed.` });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/payments/demo/complete") {
    const body = await readBody(req);
    const order = store.orders.find((item) => item.id === body.orderId && item.ownerId === ownerId);
    if (!order) return sendError(res, 404, "Order not found");
    markOrderPaid(store, order, { razorpay_order_id: order.razorpayOrderId, razorpay_payment_id: `pay_demo_${Date.now()}` });
    store.paymentEvents.push({ provider: "demo", orderId: order.id, event: "paid", createdAt: new Date().toISOString() });
    await notifyOrderPlaced(store, order);
    await saveStore(store);
    sendJson(res, 200, { order, message: `Demo payment completed. Order ${order.id} is confirmed.` });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/webhooks/razorpay") {
    const bodyText = await new Promise((resolve) => {
      let text = "";
      req.on("data", (chunk) => { text += chunk; });
      req.on("end", () => resolve(text));
    });
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-razorpay-signature"] || "";
    const valid = webhookSecret
      ? safeCompare(crypto.createHmac("sha256", webhookSecret).update(bodyText).digest("hex"), signature)
      : false;
    const payload = JSON.parse(bodyText || "{}");
    store.paymentEvents.push({ provider: "razorpay", event: payload.event || "webhook", valid, createdAt: new Date().toISOString() });
    await saveStore(store);
    sendJson(res, valid ? 200 : 400, { ok: valid });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/newsletter") {
    const body = await readBody(req);
    const phone = String(body.phone || "").trim();
    if (phone && !store.newsletter.some((entry) => entry.phone === phone)) {
      store.newsletter.push({ phone, createdAt: new Date().toISOString() });
      await saveStore(store);
    }
    sendJson(res, 200, { message: "Signup saved." });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/login") {
    const body = await readBody(req);
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    if (!safeCompare(email, ADMIN_EMAIL) || !safeCompare(password, ADMIN_PASSWORD)) {
      return sendError(res, 401, "Invalid admin credentials");
    }
    const token = createToken("admin");
    store.adminSessions[token] = { email, createdAt: new Date().toISOString() };
    await saveStore(store);
    sendJson(res, 200, { token, admin: { email } });
    return;
  }

  if (url.pathname.startsWith("/api/admin/")) {
    if (!requireAdmin(req, store, res)) return;

    if (req.method === "GET" && url.pathname === "/api/admin/dashboard") {
      const revenue = store.orders.filter((order) => order.paymentStatus === "paid").reduce((total, order) => total + order.summary.total, 0);
      sendJson(res, 200, {
        totals: {
          products: store.products.length,
          orders: store.orders.length,
          customers: store.users.length,
          newsletter: store.newsletter.length,
          revenue,
          revenueText: money(revenue)
        },
        recentOrders: store.orders.slice(-8).reverse(),
        recentCustomers: store.users.slice(-8).reverse()
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/products") {
      sendJson(res, 200, { products: store.products });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/products") {
      const body = await readBody(req);
      const product = sanitizeProduct(body);
      if (store.products.some((item) => item.id === product.id)) product.id = `${product.id}-${Date.now()}`;
      store.products.push(product);
      await saveStore(store);
      sendJson(res, 201, { product });
      return;
    }

    if ((req.method === "PUT" || req.method === "PATCH") && parts[2] === "products" && parts[3]) {
      const product = store.products.find((item) => item.id === parts[3]);
      if (!product) return sendError(res, 404, "Product not found");
      Object.assign(product, sanitizeProduct(await readBody(req), product));
      await saveStore(store);
      sendJson(res, 200, { product });
      return;
    }

    if (req.method === "DELETE" && parts[2] === "products" && parts[3]) {
      const product = store.products.find((item) => item.id === parts[3]);
      if (!product) return sendError(res, 404, "Product not found");
      product.active = false;
      product.updatedAt = new Date().toISOString();
      await saveStore(store);
      sendJson(res, 200, { product });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/orders") {
      sendJson(res, 200, { orders: store.orders.slice().reverse() });
      return;
    }

    if ((req.method === "PUT" || req.method === "PATCH") && parts[2] === "orders" && parts[3]) {
      const order = store.orders.find((item) => item.id === parts[3]);
      if (!order) return sendError(res, 404, "Order not found");
      const body = await readBody(req);
      order.status = String(body.status || order.status).trim();
      order.updatedAt = new Date().toISOString();
      await saveStore(store);
      sendJson(res, 200, { order });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/customers") {
      sendJson(res, 200, { users: store.users.map(sanitizeUser), newsletter: store.newsletter });
      return;
    }
  }

  sendError(res, 404, "API route not found");
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) return sendError(res, 403, "Forbidden");
  try {
    const stat = await fs.stat(filePath);
    const finalPath = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const ext = path.extname(finalPath).toLowerCase();
    const content = await fs.readFile(finalPath);
    setSecurityHeaders(res);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  } catch {
    sendError(res, 404, "Page not found");
  }
}

const rateLimit = new Map();

function withinRateLimit(req) {
  const ip = req.socket.remoteAddress || "local";
  const key = `${ip}:${Math.floor(Date.now() / 60000)}`;
  const count = (rateLimit.get(key) || 0) + 1;
  rateLimit.set(key, count);
  return count <= 240;
}

const server = http.createServer(async (req, res) => {
  try {
    if (!withinRateLimit(req)) return sendError(res, 429, "Too many requests");
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    sendError(res, 500, error.message || "Server error");
  }
});

server.listen(PORT, () => {
  console.log(`${STORE_NAME} ecommerce running at ${BASE_URL}`);
});
