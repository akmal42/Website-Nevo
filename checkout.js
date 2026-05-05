const cartList = document.querySelector("[data-cart-items]");
const checkoutCount = document.querySelector("[data-checkout-count]");
const subtotalEl = document.querySelector("[data-subtotal]");
const discountEl = document.querySelector("[data-discount]");
const totalEl = document.querySelector("[data-total]");
const orderNote = document.querySelector("[data-order-note]");
const placeOrder = document.querySelector("[data-place-order]");

let cart = JSON.parse(localStorage.getItem("nevoCart") || "[]");

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

function saveCart() {
  localStorage.setItem("nevoCart", JSON.stringify(cart));
}

function getSummary(items) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = Math.round(subtotal * 0.1);
  return {
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount)
  };
}

function updateSummary(summary = getSummary(cart)) {
  checkoutCount.textContent = summary.itemCount;
  subtotalEl.textContent = summary.subtotalText || formatPrice(summary.subtotal);
  discountEl.textContent = summary.discountText || `- ${formatPrice(summary.discount)}`;
  totalEl.textContent = summary.totalText || formatPrice(summary.total);
}

function renderCart(summary) {
  updateSummary(summary);

  if (!cart.length) {
    cartList.innerHTML = `
      <div class="empty-cart">
        <h3>Your bag is empty</h3>
        <p>Add products from the collection page to continue checkout.</p>
        <a class="primary-link" href="index.html#products">Start Shopping</a>
      </div>
    `;
    placeOrder.disabled = true;
    return;
  }

  placeOrder.disabled = false;
  cartList.innerHTML = cart.map((item) => `
    <article class="cart-item">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>Size: ${escapeHtml(item.size || "M")} | Qty: ${item.quantity}</p>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
      </div>
      <button type="button" data-remove-item="${escapeHtml(item.productId || item.name)}">Remove</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-remove-item]").forEach((button) => {
    button.addEventListener("click", async () => {
      const productId = button.dataset.removeItem;
      try {
        const payload = await apiFetch(`/api/cart/items/${productId}`, { method: "DELETE" });
        cart = payload.cart;
        saveCart();
        renderCart(payload.summary);
      } catch {
        cart = cart.filter((item) => (item.productId || item.name) !== productId);
        saveCart();
        renderCart();
      }
    });
  });
}

async function loadCart() {
  try {
    const payload = await apiFetch("/api/cart");
    if (!payload.cart.length && cart.length) {
      const synced = await apiFetch("/api/cart", {
        method: "PUT",
        body: JSON.stringify({ cart })
      });
      cart = synced.cart;
      saveCart();
      renderCart(synced.summary);
      return;
    }
    cart = payload.cart;
    saveCart();
    renderCart(payload.summary);
  } catch {
    renderCart();
  }
}

placeOrder.addEventListener("click", async () => {
  const form = document.querySelector("[data-checkout-form]");
  if (!form.reportValidity()) return;
  placeOrder.disabled = true;
  placeOrder.textContent = "Processing";

  const orderPayload = {
    name: document.querySelector("#checkout-name").value.trim(),
    phone: document.querySelector("#checkout-phone").value.trim(),
    address: document.querySelector("#checkout-address").value.trim()
  };

  try {
    const payload = await apiFetch("/api/payments/razorpay/order", {
      method: "POST",
      body: JSON.stringify(orderPayload)
    });

    if (payload.mode === "razorpay" && window.Razorpay) {
      const options = {
        ...payload.checkout,
        handler: async (response) => {
          const verified = await apiFetch("/api/payments/razorpay/verify", {
            method: "POST",
            body: JSON.stringify({
              orderId: payload.order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          orderNote.textContent = verified.message;
          cart = [];
          saveCart();
          renderCart();
        },
        modal: {
          ondismiss: () => {
            orderNote.textContent = "Payment was cancelled. Your bag is still saved.";
            placeOrder.disabled = false;
            placeOrder.textContent = "Pay Securely";
          }
        },
        theme: { color: "#111111" }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      return;
    }

    const demo = await apiFetch("/api/payments/demo/complete", {
      method: "POST",
      body: JSON.stringify({ orderId: payload.order.id })
    });
    orderNote.textContent = `${demo.message} Add Razorpay keys in .env to collect real payments.`;
  } catch {
    orderNote.textContent = "Payment could not be started. Please check backend settings.";
    placeOrder.disabled = false;
    placeOrder.textContent = "Pay Securely";
    return;
  }

  cart = [];
  saveCart();
  renderCart();
  placeOrder.textContent = "Pay Securely";
});

loadCart();
