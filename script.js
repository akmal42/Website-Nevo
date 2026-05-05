const productGrid = document.querySelector("[data-product-grid]");
const categoryButtons = document.querySelectorAll("[data-filter]");
const jumpLinks = document.querySelectorAll("[data-filter-jump]");
const checkFilters = document.querySelectorAll("[data-check-filter]");
const priceFilters = document.querySelectorAll("[data-price-filter]");
const productCount = document.querySelector("[data-product-count]");
const bagCount = document.querySelector("[data-bag-count]");
const sortSelect = document.querySelector("[data-sort]");
const filters = document.querySelector("[data-filters]");
const searchPanel = document.querySelector("[data-search-panel]");
const searchInput = document.querySelector("[data-search-input]");
const searchResults = document.querySelector("[data-search-results]");
const nav = document.querySelector(".main-nav");
const signupPopup = document.querySelector("[data-signup-popup]");
const phoneForm = document.querySelector("[data-phone-form]");
const signupNote = document.querySelector("[data-signup-note]");
const mainSearch = document.querySelector("[data-main-search]");
const wishlistCount = document.querySelector("[data-wishlist-count]");

let activeCategory = "all";
let productData = [];
let wishlistItems = [];
let cartItems = JSON.parse(localStorage.getItem("nevoCart") || "[]");

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

function getFallbackProducts() {
  return [
    {
      id: "fallback-graphic-tee",
      name: "Oversized Graphic T-Shirt",
      subtitle: "Oversized | Printed",
      detail: "Off White",
      category: ["clothing", "new"],
      brand: "Nevo Studio",
      price: 719,
      mrp: 1199,
      discount: "40% OFF",
      deal: "Launch Deal: Rs. 647",
      rating: 4.5,
      badge: "New Drop",
      sizes: ["S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=85"
    },
    {
      id: "fallback-oxford-shirt",
      name: "Oxford Button Down Shirt",
      subtitle: "Regular fit | Cotton",
      detail: "Sky Blue",
      category: ["clothing"],
      brand: "Nevo Essentials",
      price: 1299,
      mrp: 2199,
      discount: "41% OFF",
      deal: "Launch Deal: Rs. 1,169",
      rating: 4.6,
      badge: "",
      sizes: ["S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=85"
    },
    {
      id: "fallback-slim-denim",
      name: "Slim Fit Denim Jeans",
      subtitle: "Slim fit | Heavy fade",
      detail: "Blue",
      category: ["bottomwear", "new"],
      brand: "Nevo Essentials",
      price: 1679,
      mrp: 2799,
      discount: "40% OFF",
      deal: "Launch Deal: Rs. 1,511",
      rating: 4.5,
      badge: "",
      sizes: ["30", "32", "34", "36"],
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=85"
    },
    {
      id: "fallback-cargo-trouser",
      name: "Relaxed Cargo Trouser",
      subtitle: "Utility pockets | Cotton",
      detail: "Stone",
      category: ["bottomwear"],
      brand: "Nevo Studio",
      price: 1599,
      mrp: 2699,
      discount: "41% OFF",
      deal: "Launch Deal: Rs. 1,439",
      rating: 4.4,
      badge: "",
      sizes: ["30", "32", "34", "36"],
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=85"
    },
    {
      id: "fallback-avenue-runner",
      name: "Avenue Runner Sneakers",
      subtitle: "White | Grey",
      detail: "Lighttag",
      category: ["footwear", "new"],
      brand: "Nevo Kicks",
      price: 2099,
      mrp: 4199,
      discount: "50% OFF",
      deal: "Launch Deal: Rs. 1,889",
      rating: 4.5,
      badge: "",
      sizes: ["7", "8", "9", "10"],
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=85"
    },
    {
      id: "fallback-trail-knit",
      name: "Trail Knit Sneakers",
      subtitle: "Cushion sole | Sport",
      detail: "Charcoal",
      category: ["footwear", "new"],
      brand: "Nevo Kicks",
      price: 2399,
      mrp: 3999,
      discount: "40% OFF",
      deal: "Launch Deal: Rs. 2,159",
      rating: 4.7,
      badge: "New Drop",
      sizes: ["7", "8", "9", "10"],
      image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=700&q=85"
    }
  ];
}

function renderProductCard(product) {
  const categories = product.category.join(" ");
  const isWishlisted = wishlistItems.some((item) => item.productId === product.id);
  const badge = product.badge ? `<span class="badge">${escapeHtml(product.badge)}</span>` : "";
  const sizes = product.sizes?.length ? product.sizes.join("  ") : "S  M  L  XL";

  return `
    <article class="product-card" data-id="${escapeHtml(product.id)}" data-category="${escapeHtml(categories)}" data-price="${product.price}" data-name="${escapeHtml(product.name)}">
      <div class="product-media">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        ${badge}
        <button class="${isWishlisted ? "wishlisted" : ""}" type="button" aria-label="Add to wishlist" data-wishlist="${escapeHtml(product.id)}">${isWishlisted ? "&#9829;" : "&#9825;"}</button>
      </div>
      <div class="product-body">
        <div class="rating">&#9733; ${Number(product.rating || 4.5).toFixed(1)}</div>
        <p>${escapeHtml(product.subtitle)}</p>
        <h3 data-sizes="Sizes: ${escapeHtml(sizes)}">${escapeHtml(product.name)}${product.detail ? ` | ${escapeHtml(product.detail)}` : ""}</h3>
        <div class="price"><strong>${formatPrice(product.price)}</strong><s>${formatPrice(product.mrp)}</s><span>${escapeHtml(product.discount)}</span></div>
        <em>${escapeHtml(product.deal)}</em>
        <button type="button" data-add-bag="${escapeHtml(product.id)}">Add to Bag</button>
      </div>
    </article>
  `;
}

function renderProducts() {
  productGrid.innerHTML = productData.map(renderProductCard).join("");
  bindProductActions();
  applyFilters();
}

function updateBagCount(summary) {
  const total = summary?.itemCount ?? cartItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  bagCount.textContent = total;
}

function updateWishlistCount() {
  wishlistCount.textContent = wishlistItems.length;
}

function selectedValues(nodes) {
  return Array.from(nodes)
    .filter((node) => node.checked)
    .map((node) => node.value);
}

function matchesPrice(product, selectedPrices) {
  if (!selectedPrices.length) return true;
  return selectedPrices.some((filter) => {
    if (filter === "under1500") return product.price < 1500;
    if (filter === "under3000") return product.price < 3000;
    return true;
  });
}

function applyFilters() {
  const cards = Array.from(document.querySelectorAll(".product-card"));
  const selectedCategories = selectedValues(checkFilters);
  const selectedPrices = selectedValues(priceFilters);
  let visibleCount = 0;

  cards.forEach((card) => {
    const categories = card.dataset.category.split(" ");
    const product = productData.find((item) => item.id === card.dataset.id) || { price: Number(card.dataset.price) };
    const quickCategoryMatch = activeCategory === "all" || categories.includes(activeCategory);
    const checkboxMatch = !selectedCategories.length || selectedCategories.some((category) => categories.includes(category));
    const priceMatch = matchesPrice(product, selectedPrices);
    const visible = quickCategoryMatch && checkboxMatch && priceMatch;

    card.classList.toggle("is-hidden", !visible);
    if (visible) visibleCount += 1;
  });

  productCount.textContent = visibleCount;
  categoryButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === activeCategory);
  });
}

function sortProducts(mode) {
  productData.sort((a, b) => {
    if (mode === "low") return a.price - b.price;
    if (mode === "high") return b.price - a.price;
    if (mode === "new") return Number(b.category.includes("new")) - Number(a.category.includes("new"));
    return 0;
  });
  renderProducts();
}

function renderSearch(query = "") {
  const value = query.trim().toLowerCase();
  const matches = productData.filter((product) => {
    return !value || `${product.name} ${product.category.join(" ")} ${product.brand}`.toLowerCase().includes(value);
  });

  searchResults.innerHTML = matches.length
    ? matches.map((product) => `
      <button class="search-result" type="button" data-search-product="${escapeHtml(product.id)}">
        <strong>${escapeHtml(product.name)}</strong>
        <span>${formatPrice(product.price)}</span>
      </button>
    `).join("")
    : "<div class=\"search-result\"><strong>No product found</strong><span>Try another search</span></div>";

  document.querySelectorAll("[data-search-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = document.querySelector(`[data-id="${button.dataset.searchProduct}"]`);
      searchPanel.classList.remove("open");
      searchPanel.setAttribute("aria-hidden", "true");
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

async function syncCartFromApi() {
  try {
    const payload = await apiFetch("/api/cart");
    if (!payload.cart.length && cartItems.length) {
      const synced = await apiFetch("/api/cart", {
        method: "PUT",
        body: JSON.stringify({ cart: cartItems })
      });
      cartItems = synced.cart;
      localStorage.setItem("nevoCart", JSON.stringify(cartItems));
      updateBagCount(synced.summary);
      return;
    }
    cartItems = payload.cart;
    localStorage.setItem("nevoCart", JSON.stringify(cartItems));
    updateBagCount(payload.summary);
  } catch {
    updateBagCount();
  }
}

async function syncWishlistFromApi() {
  try {
    const payload = await apiFetch("/api/wishlist");
    wishlistItems = payload.wishlist;
    updateWishlistCount();
  } catch {
    wishlistItems = JSON.parse(localStorage.getItem("nevoWishlist") || "[]");
    updateWishlistCount();
  }
}

function bindProductActions() {
  document.querySelectorAll("[data-add-bag]").forEach((button) => {
    button.addEventListener("click", async () => {
      const product = productData.find((item) => item.id === button.dataset.addBag);
      if (!product) return;

      try {
        const payload = await apiFetch("/api/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId: product.id, quantity: 1, size: product.sizes?.[1] || "M" })
        });
        cartItems = payload.cart;
        updateBagCount(payload.summary);
      } catch {
        const existing = cartItems.find((item) => item.productId === product.id);
        if (existing) existing.quantity += 1;
        else cartItems.push({ productId: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, size: "M" });
        updateBagCount();
      }

      localStorage.setItem("nevoCart", JSON.stringify(cartItems));
      button.classList.add("added");
      button.textContent = "Added";
      window.setTimeout(() => {
        button.classList.remove("added");
        button.textContent = "Add to Bag";
      }, 1000);
    });
  });

  document.querySelectorAll("[data-wishlist]").forEach((button) => {
    button.addEventListener("click", async () => {
      const productId = button.dataset.wishlist;
      const alreadyWishlisted = wishlistItems.some((item) => item.productId === productId);
      try {
        const payload = await apiFetch(alreadyWishlisted ? `/api/wishlist/${productId}` : "/api/wishlist", {
          method: alreadyWishlisted ? "DELETE" : "POST",
          body: alreadyWishlisted ? undefined : JSON.stringify({ productId })
        });
        wishlistItems = payload.wishlist;
      } catch {
        if (alreadyWishlisted) wishlistItems = wishlistItems.filter((item) => item.productId !== productId);
        else {
          const product = productData.find((item) => item.id === productId);
          wishlistItems.push({ productId, name: product.name, price: product.price, image: product.image });
        }
      }

      localStorage.setItem("nevoWishlist", JSON.stringify(wishlistItems));
      updateWishlistCount();
      renderProducts();
    });
  });
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filter;
    applyFilters();
  });
});

jumpLinks.forEach((link) => {
  link.addEventListener("click", () => {
    activeCategory = link.dataset.filterJump;
    applyFilters();
  });
});

checkFilters.forEach((input) => input.addEventListener("change", applyFilters));
priceFilters.forEach((input) => input.addEventListener("change", applyFilters));

document.querySelector("[data-clear]").addEventListener("click", () => {
  checkFilters.forEach((input) => {
    input.checked = false;
  });
  priceFilters.forEach((input) => {
    input.checked = false;
  });
  activeCategory = "all";
  applyFilters();
});

sortSelect.addEventListener("change", () => sortProducts(sortSelect.value));

document.querySelector("[data-filter-toggle]").addEventListener("click", () => {
  filters.classList.toggle("open");
});

document.querySelector("[data-menu-toggle]").addEventListener("click", () => {
  nav.classList.toggle("open");
});

nav.addEventListener("click", () => {
  nav.classList.remove("open");
});

document.querySelector("[data-search-open]").addEventListener("click", () => {
  searchPanel.classList.add("open");
  searchPanel.setAttribute("aria-hidden", "false");
  renderSearch();
  window.setTimeout(() => searchInput.focus(), 0);
});

document.querySelector("[data-search-close]").addEventListener("click", () => {
  searchPanel.classList.remove("open");
  searchPanel.setAttribute("aria-hidden", "true");
});

searchPanel.addEventListener("click", (event) => {
  if (event.target === searchPanel) {
    searchPanel.classList.remove("open");
    searchPanel.setAttribute("aria-hidden", "true");
  }
});

searchInput.addEventListener("input", () => renderSearch(searchInput.value));

if (mainSearch) {
  mainSearch.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    searchPanel.classList.add("open");
    searchPanel.setAttribute("aria-hidden", "false");
    searchInput.value = mainSearch.value;
    renderSearch(mainSearch.value);
  });
}

function closeSignupPopup() {
  signupPopup.classList.remove("open");
  signupPopup.setAttribute("aria-hidden", "true");
  localStorage.setItem("nevoSignupSeen", "true");
}

function openSignupPopup() {
  if (localStorage.getItem("nevoSignupSeen") === "true") return;
  window.setTimeout(() => {
    signupPopup.classList.add("open");
    signupPopup.setAttribute("aria-hidden", "false");
    document.querySelector("#phone").focus();
  }, 650);
}

document.querySelector("[data-signup-close]").addEventListener("click", closeSignupPopup);
document.querySelector("[data-signup-skip]").addEventListener("click", closeSignupPopup);

signupPopup.addEventListener("click", (event) => {
  if (event.target === signupPopup) closeSignupPopup();
});

phoneForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const phone = document.querySelector("#phone").value.trim();
  try {
    await apiFetch("/api/newsletter", {
      method: "POST",
      body: JSON.stringify({ phone })
    });
  } catch {
    localStorage.setItem("nevoSignupPhone", phone);
  }
  signupNote.textContent = "Thanks. Your demo signup is confirmed.";
  window.setTimeout(closeSignupPopup, 900);
});

async function initStorefront() {
  productData = getFallbackProducts();
  try {
    const payload = await apiFetch("/api/products");
    if (payload.products?.length) productData = payload.products;
  } catch {
    productData = getFallbackProducts();
  }

  await syncWishlistFromApi();
  renderProducts();
  await syncCartFromApi();
  openSignupPopup();
}

initStorefront();
