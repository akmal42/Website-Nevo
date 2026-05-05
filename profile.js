const profileNav = document.querySelector(".main-nav");
const menuButton = document.querySelector("[data-profile-menu]");
const tabs = document.querySelectorAll("[data-profile-tab]");
const panels = document.querySelectorAll("[data-profile-panel]");
const loginForm = document.querySelector("[data-login-form]");
const loginNote = document.querySelector("[data-login-note]");
const demoUser = document.querySelector("[data-demo-user]");
const demoStatus = document.querySelector("[data-demo-status]");
const accountName = document.querySelector("[data-account-name]");
const bagCount = document.querySelector("[data-profile-bag-count]");
const favoritesGrid = document.querySelector("[data-favorite-grid]");
const orderTimeline = document.querySelector("[data-order-timeline]");
const ordersCount = document.querySelector("[data-orders-count]");
const rewardsAmount = document.querySelector("[data-rewards-amount]");
const savedCount = document.querySelector("[data-saved-count]");
const savedAddress = document.querySelector("[data-saved-address]");
const savedPhone = document.querySelector("[data-saved-phone]");

function getVisitorId() {
  let visitorId = localStorage.getItem("nevoVisitorId");
  if (!visitorId) {
    visitorId = `visitor-${Math.random().toString(16).slice(2)}-${Date.now()}`;
    localStorage.setItem("nevoVisitorId", visitorId);
  }
  return visitorId;
}

function getAuthToken() {
  return localStorage.getItem("nevoAuthToken") || "";
}

async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Nevo-Session": getVisitorId(),
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }

  return response.json();
}

function formatPrice(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setActivePanel(panelName) {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.profileTab === panelName);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.profilePanel === panelName);
  });
}

function updateDemoUser(user) {
  const storedName = user?.name || localStorage.getItem("nevoDemoUser");
  if (!storedName) return;
  demoUser.textContent = storedName;
  accountName.textContent = storedName;
  demoStatus.textContent = "Logged in demo member";
  if (user?.contact) savedPhone.textContent = user.contact;
  if (user?.address || user?.city) savedAddress.textContent = user.address || user.city;
  if (user?.rewards) rewardsAmount.textContent = formatPrice(user.rewards);
}

async function refreshCartCount() {
  try {
    const payload = await apiFetch("/api/cart");
    bagCount.textContent = payload.summary.itemCount;
  } catch {
    const cart = JSON.parse(localStorage.getItem("nevoCart") || "[]");
    bagCount.textContent = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  }
}

async function refreshFavorites() {
  let wishlist = JSON.parse(localStorage.getItem("nevoWishlist") || "[]");
  try {
    const payload = await apiFetch("/api/wishlist");
    wishlist = payload.wishlist;
  } catch {
    // Local fallback keeps the profile useful without the backend.
  }

  savedCount.textContent = String(wishlist.length).padStart(2, "0");

  if (!wishlist.length) {
    favoritesGrid.innerHTML = `
      <article>
        <h3>No favorites yet</h3>
        <p>Save products from the storefront to see them here.</p>
        <a class="primary-link" href="index.html#products">Shop Products</a>
      </article>
    `;
    return;
  }

  favoritesGrid.innerHTML = wishlist.map((item) => `
    <article>
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${formatPrice(item.price)}</p>
      <button type="button" data-move-bag="${escapeHtml(item.productId)}">Move to Bag</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-move-bag]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiFetch("/api/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId: button.dataset.moveBag, quantity: 1, size: "M" })
        });
        await refreshCartCount();
      } catch {
        loginNote.textContent = "Start the backend server to sync favorites to bag.";
      }
    });
  });
}

async function refreshOrders() {
  try {
    const payload = await apiFetch("/api/orders");
    ordersCount.textContent = String(payload.orders.length).padStart(2, "0");
    const latest = payload.orders[0];
    if (!latest) return;
    orderTimeline.querySelector("[data-order-id]").textContent = `Order #${latest.id}`;
    orderTimeline.querySelector("[data-order-status]").textContent = latest.status;
  } catch {
    // Static timeline remains in place for file-only preview.
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActivePanel(tab.dataset.profileTab));
});

menuButton.addEventListener("click", () => {
  profileNav.classList.toggle("open");
});

profileNav.addEventListener("click", () => {
  profileNav.classList.remove("open");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.querySelector("#login-name").value.trim() || "Demo User";
  const contact = document.querySelector("#login-contact").value.trim();

  try {
    const payload = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ name, contact })
    });
    localStorage.setItem("nevoAuthToken", payload.token);
    localStorage.setItem("nevoDemoUser", payload.user.name);
    updateDemoUser(payload.user);
    loginNote.textContent = "Login successful. Account synced with the backend.";
  } catch {
    localStorage.setItem("nevoDemoUser", name);
    updateDemoUser({ name, contact });
    loginNote.textContent = "Login saved locally. Start the backend server to sync.";
  }

  await refreshCartCount();
  await refreshFavorites();
  await refreshOrders();
  setActivePanel("account");
});

async function initProfile() {
  updateDemoUser();
  try {
    const payload = await apiFetch("/api/me");
    updateDemoUser(payload.user);
  } catch {
    // Guest users can still browse account preview.
  }
  await refreshCartCount();
  await refreshFavorites();
  await refreshOrders();
}

initProfile();
