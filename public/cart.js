// Quantity stepper buttons
document.querySelectorAll(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        const cartRow = btn.closest(".cart-row");
        const menuItemId = cartRow.dataset.itemid || cartRow.dataset.itemId;

        btn.disabled = true;

        fetch(`/Mensa.app/canteen/${slug}/cart/${action}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ menuItemId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.removed) {
                    cartRow.remove();
                } else {
                    const qtyVal = cartRow.querySelector(".qty-val");
                    if (qtyVal) qtyVal.textContent = data.count;
                    const subtotal = cartRow.querySelector(".cart-subtotal");
                    if (subtotal) subtotal.innerHTML = `&#8377; ${data.subtotal}`;
                }

                const cartTotal = document.getElementById("cartTotal");
                if (cartTotal) cartTotal.innerHTML = `&#8377;${data.total}`;
                const cartTotalSummary = document.getElementById("cartTotalSummary");
                if (cartTotalSummary) cartTotalSummary.innerHTML = `&#8377;${data.total}`;

                document.querySelectorAll("#cartBadge, .cart-badge, .cart-pill-count").forEach(el => el.textContent = data.cartCount);

                if (data.isEmpty) {
                    const cartWrap = document.querySelector(".cart-page-wrap") || document.querySelector(".cart-wrap");
                    if (cartWrap) {
                        cartWrap.innerHTML = `
                            <div class="cart-nav-bar">
                                <a href="/Mensa.app/canteen/${slug}/dashboard/user" class="back-link"><i class="fa-solid fa-arrow-left"></i> <span>Back to Menu</span></a>
                            </div>
                            <div class="empty-cart-card">
                                <div class="empty-cart-icon"><i class="fa-solid fa-basket-shopping"></i></div>
                                <h2>Your cart is empty</h2>
                                <p class="grey-text">Looks like you haven't added anything to your tray yet.</p>
                                <a href="/Mensa.app/canteen/${slug}/dashboard/user" class="btn-primary" style="margin-top: 1rem;">Browse Canteen Menu</a>
                            </div>
                        `;
                    }
                }
            } else {
                alert(data.msg || "Failed to update cart.");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Something went wrong — please try again.");
        })
        .finally(() => {
            btn.disabled = false;
        });
    });
});

// Remove item buttons (✕)
document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const cartRow = btn.closest(".cart-row");
        const menuItemId = btn.dataset.itemId || cartRow.dataset.itemid;

        btn.disabled = true;

        fetch(`/Mensa.app/canteen/${slug}/cart/remove`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ menuItemId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                cartRow.remove();

                const cartTotal = document.getElementById("cartTotal");
                if (cartTotal) cartTotal.innerHTML = `&#8377;${data.total}`;
                const cartTotalSummary = document.getElementById("cartTotalSummary");
                if (cartTotalSummary) cartTotalSummary.innerHTML = `&#8377;${data.total}`;

                document.querySelectorAll("#cartBadge, .cart-badge, .cart-pill-count").forEach(el => el.textContent = data.cartCount);

                if (data.isEmpty) {
                    const cartWrap = document.querySelector(".cart-page-wrap") || document.querySelector(".cart-wrap");
                    if (cartWrap) {
                        cartWrap.innerHTML = `
                            <div class="cart-nav-bar">
                                <a href="/Mensa.app/canteen/${slug}/dashboard/user" class="back-link"><i class="fa-solid fa-arrow-left"></i> <span>Back to Menu</span></a>
                            </div>
                            <div class="empty-cart-card">
                                <div class="empty-cart-icon"><i class="fa-solid fa-basket-shopping"></i></div>
                                <h2>Your cart is empty</h2>
                                <p class="grey-text">Looks like you haven't added anything to your tray yet.</p>
                                <a href="/Mensa.app/canteen/${slug}/dashboard/user" class="btn-primary" style="margin-top: 1rem;">Browse Canteen Menu</a>
                            </div>
                        `;
                    }
                }
            } else {
                alert(data.msg || "Failed to remove item.");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Something went wrong — please try again.");
        })
        .finally(() => {
            btn.disabled = false;
        });
    });
});

// Delivery mode, order type, and slot toggle logic
const deliveryModeSelect = document.getElementById("deliveryMode");
const orderTypeSelect = document.getElementById("orderType");
const orderTypeGroup = document.querySelector(".order-type-div");
const slotGroup = document.querySelector(".slot-select-div");
const slotSelect = document.getElementById("slot");
const roomNoGroup = document.getElementById("roomNoGroup");
const roomNoInput = document.getElementById("roomNo");

if (deliveryModeSelect) {
    deliveryModeSelect.addEventListener("change", () => {
        if (deliveryModeSelect.value === "hostel") {
            if (roomNoGroup) roomNoGroup.style.display = "block";
            if (orderTypeGroup) orderTypeGroup.style.display = "none";
            if (slotGroup) slotGroup.style.display = "none";
            if (slotSelect) slotSelect.disabled = true;
        } else {
            if (roomNoGroup) roomNoGroup.style.display = "none";
            if (orderTypeGroup) orderTypeGroup.style.display = "block";
            if (orderTypeSelect && orderTypeSelect.value === "slot") {
                if (slotGroup) slotGroup.style.display = "block";
                if (slotSelect) slotSelect.disabled = false;
            }
        }
    });
}

if (orderTypeSelect) {
    orderTypeSelect.addEventListener("change", () => {
        if (orderTypeSelect.value === "slot") {
            if (slotGroup) slotGroup.style.display = "block";
            if (slotSelect) slotSelect.disabled = false;
        } else {
            if (slotGroup) slotGroup.style.display = "none";
            if (slotSelect) slotSelect.disabled = true;
        }
    });
}

// Place Order Form submit handler
const placeOrderForm = document.getElementById("placeOrderForm");
if (placeOrderForm) {
    placeOrderForm.addEventListener("submit", (e) => {
        const mode = deliveryModeSelect ? deliveryModeSelect.value : "counter";
        if (mode === "hostel") {
            const roomVal = roomNoInput ? roomNoInput.value.trim() : "";
            if (!roomVal) {
                roomNoInput.value = "Room 101";
            }
        }
    });
}