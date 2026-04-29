const productGrid = document.querySelector("[data-product-grid]");
const products = Array.from(document.querySelectorAll(".product-card"));
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
let cartItems = JSON.parse(localStorage.getItem("nevoCart") || "[]");
let wishlistItems = 0;

const productData = products.map((product) => ({
  element: product,
  name: product.dataset.name,
  categories: product.dataset.category.split(" "),
  price: Number(product.dataset.price),
  priceText: product.querySelector(".price strong").textContent,
  image: product.querySelector(".product-media img").src,
}));

function updateBagCount() {
  bagCount.textContent = cartItems.reduce((total, item) => total + item.quantity, 0);
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
  const selectedCategories = selectedValues(checkFilters);
  const selectedPrices = selectedValues(priceFilters);
  let visibleCount = 0;

  productData.forEach((product) => {
    const quickCategoryMatch = activeCategory === "all" || product.categories.includes(activeCategory);
    const checkboxMatch = !selectedCategories.length || selectedCategories.some((category) => product.categories.includes(category));
    const priceMatch = matchesPrice(product, selectedPrices);
    const visible = quickCategoryMatch && checkboxMatch && priceMatch;

    product.element.classList.toggle("is-hidden", !visible);
    if (visible) visibleCount += 1;
  });

  productCount.textContent = visibleCount;
  categoryButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === activeCategory);
  });
}

function sortProducts(mode) {
  const sorted = [...productData].sort((a, b) => {
    if (mode === "low") return a.price - b.price;
    if (mode === "high") return b.price - a.price;
    if (mode === "new") return b.categories.includes("new") - a.categories.includes("new");
    return products.indexOf(a.element) - products.indexOf(b.element);
  });

  sorted.forEach((product) => productGrid.appendChild(product.element));
}

function renderSearch(query = "") {
  const value = query.trim().toLowerCase();
  const matches = productData.filter((product) => {
    return !value || `${product.name} ${product.categories.join(" ")}`.toLowerCase().includes(value);
  });

  searchResults.innerHTML = matches.length
    ? matches.map((product) => `
      <div class="search-result">
        <strong>${product.name}</strong>
        <span>${product.priceText}</span>
      </div>
    `).join("")
    : "<div class=\"search-result\"><strong>No product found</strong><span>Try another search</span></div>";
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

sortSelect.addEventListener("change", () => {
  sortProducts(sortSelect.value);
});

document.querySelectorAll("[data-add-bag]").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".product-card");
    const product = productData.find((item) => item.element === card);
    const existing = cartItems.find((item) => item.name === product.name);

    if (existing) {
      existing.quantity += 1;
    } else {
      cartItems.push({
        name: product.name,
        price: product.price,
        priceText: product.priceText,
        image: product.image,
        quantity: 1,
      });
    }

    localStorage.setItem("nevoCart", JSON.stringify(cartItems));
    updateBagCount();
    button.classList.add("added");
    button.textContent = "Added";
    window.setTimeout(() => {
      button.classList.remove("added");
      button.textContent = "Add to Bag";
    }, 1000);
  });
});

document.querySelectorAll('[aria-label="Add to wishlist"]').forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("wishlisted")) return;
    wishlistItems += 1;
    wishlistCount.textContent = wishlistItems;
    button.classList.add("wishlisted");
    button.textContent = "♥";
  });
});

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

phoneForm.addEventListener("submit", (event) => {
  event.preventDefault();
  signupNote.textContent = "Thanks. Your demo signup is confirmed.";
  window.setTimeout(closeSignupPopup, 900);
});

applyFilters();
updateBagCount();
openSignupPopup();
