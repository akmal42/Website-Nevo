const loginShell = document.querySelector("[data-admin-login]");
const adminApp = document.querySelector("[data-admin-app]");
const loginForm = document.querySelector("[data-admin-login-form]");
const loginNote = document.querySelector("[data-admin-login-note]");
const logoutButton = document.querySelector("[data-admin-logout]");
const productForm = document.querySelector("[data-product-form]");
const productNote = document.querySelector("[data-product-note]");
const productList = document.querySelector("[data-admin-products]");
const orderList = document.querySelector("[data-admin-orders]");
const customerList = document.querySelector("[data-admin-customers]");

function token() {
  return localStorage.getItem("nevoAdminToken") || "";
}

async function adminFetch(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }
  return response.json();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function showApp() {
  loginShell.hidden = true;
  adminApp.hidden = false;
}

function showLogin() {
  loginShell.hidden = false;
  adminApp.hidden = true;
}

function renderProducts(products) {
  productList.innerHTML = products.length ? products.map((product) => `
    <article class="admin-row">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <span>${escapeHtml(product.category.join(", "))} | ${money(product.price)} | Stock ${product.stock}</span>
      </div>
      <button type="button" data-hide-product="${escapeHtml(product.id)}">${product.active === false ? "Hidden" : "Hide"}</button>
    </article>
  `).join("") : "<p>No products yet.</p>";

  document.querySelectorAll("[data-hide-product]").forEach((button) => {
    button.addEventListener("click", async () => {
      await adminFetch(`/api/admin/products/${button.dataset.hideProduct}`, { method: "DELETE" });
      await loadAdmin();
    });
  });
}

function renderOrders(orders) {
  orderList.innerHTML = orders.length ? orders.map((order) => `
    <article class="admin-row order-admin-row">
      <div>
        <strong>${escapeHtml(order.id)} | ${escapeHtml(order.paymentStatus || "pending")}</strong>
        <span>${escapeHtml(order.delivery?.name)} | ${escapeHtml(order.delivery?.phone)} | ${order.summary?.totalText || money(order.summary?.total)}</span>
        <small>${escapeHtml(order.items?.map((item) => `${item.name} x ${item.quantity}`).join(", "))}</small>
      </div>
      <select data-order-status="${escapeHtml(order.id)}">
        ${["Payment Pending", "Paid", "Packed", "Shipped", "Delivered", "Cancelled", "Payment Failed"].map((status) => `
          <option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>
        `).join("")}
      </select>
    </article>
  `).join("") : "<p>No orders yet.</p>";

  document.querySelectorAll("[data-order-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      await adminFetch(`/api/admin/orders/${select.dataset.orderStatus}`, {
        method: "PATCH",
        body: JSON.stringify({ status: select.value })
      });
      await loadAdmin();
    });
  });
}

function renderCustomers(users, newsletter) {
  const rows = [
    ...users.map((user) => ({ title: user.name, detail: `${user.contact || "No contact"} | ${user.city || "No city"}` })),
    ...newsletter.map((entry) => ({ title: "Newsletter signup", detail: `${entry.phone} | ${new Date(entry.createdAt).toLocaleString()}` }))
  ];
  customerList.innerHTML = rows.length ? rows.map((row) => `
    <article class="admin-row">
      <div>
        <strong>${escapeHtml(row.title)}</strong>
        <span>${escapeHtml(row.detail)}</span>
      </div>
    </article>
  `).join("") : "<p>No customer data collected yet.</p>";
}

async function loadAdmin() {
  const [dashboard, products, customers] = await Promise.all([
    adminFetch("/api/admin/dashboard"),
    adminFetch("/api/admin/products"),
    adminFetch("/api/admin/customers")
  ]);

  document.querySelector("[data-stat-products]").textContent = dashboard.totals.products;
  document.querySelector("[data-stat-orders]").textContent = dashboard.totals.orders;
  document.querySelector("[data-stat-customers]").textContent = dashboard.totals.customers;
  document.querySelector("[data-stat-revenue]").textContent = dashboard.totals.revenueText;
  renderProducts(products.products);
  renderOrders(dashboard.recentOrders);
  renderCustomers(customers.users, customers.newsletter);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginNote.textContent = "Checking...";
  try {
    const payload = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.querySelector("#admin-email").value,
        password: document.querySelector("#admin-password").value
      })
    }).then(async (response) => {
      if (!response.ok) throw new Error((await response.json()).error);
      return response.json();
    });
    localStorage.setItem("nevoAdminToken", payload.token);
    loginNote.textContent = "Logged in.";
    showApp();
    await loadAdmin();
  } catch (error) {
    loginNote.textContent = error.message || "Login failed.";
  }
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);
  const payload = Object.fromEntries(formData.entries());
  payload.price = Number(payload.price);
  payload.mrp = Number(payload.mrp || payload.price);
  payload.stock = Number(payload.stock || 0);
  payload.category = payload.category.split(",").map((item) => item.trim()).filter(Boolean);
  payload.sizes = payload.sizes.split(",").map((item) => item.trim()).filter(Boolean);
  try {
    await adminFetch("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    productForm.reset();
    productNote.textContent = "Product added to storefront.";
    await loadAdmin();
  } catch (error) {
    productNote.textContent = error.message || "Product could not be added.";
  }
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("nevoAdminToken");
  showLogin();
});

if (token()) {
  showApp();
  loadAdmin().catch(showLogin);
} else {
  showLogin();
}
