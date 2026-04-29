const cartList = document.querySelector("[data-cart-items]");
const checkoutCount = document.querySelector("[data-checkout-count]");
const subtotalEl = document.querySelector("[data-subtotal]");
const discountEl = document.querySelector("[data-discount]");
const totalEl = document.querySelector("[data-total]");
const orderNote = document.querySelector("[data-order-note]");
const placeOrder = document.querySelector("[data-place-order]");

let cart = JSON.parse(localStorage.getItem("nevoCart") || "[]");

function formatPrice(value) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function saveCart() {
  localStorage.setItem("nevoCart", JSON.stringify(cart));
}

function renderCart() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = Math.round(subtotal * 0.1);
  const total = Math.max(0, subtotal - discount);

  checkoutCount.textContent = itemCount;
  subtotalEl.textContent = formatPrice(subtotal);
  discountEl.textContent = `- ${formatPrice(discount)}`;
  totalEl.textContent = formatPrice(total);

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
  cartList.innerHTML = cart.map((item, index) => `
    <article class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h3>${item.name}</h3>
        <p>Size: M | Qty: ${item.quantity}</p>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
      </div>
      <button type="button" data-remove-item="${index}">Remove</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-remove-item]").forEach((button) => {
    button.addEventListener("click", () => {
      cart.splice(Number(button.dataset.removeItem), 1);
      saveCart();
      renderCart();
    });
  });
}

placeOrder.addEventListener("click", () => {
  const form = document.querySelector("[data-checkout-form]");
  if (!form.reportValidity()) return;
  orderNote.textContent = "Demo order placed successfully. No payment was collected.";
  cart = [];
  saveCart();
  renderCart();
});

renderCart();
