let orderTypeBtnsDiv = document.querySelector(".order-type-btns");
let ordersTables = document.querySelectorAll(".ordersTable > div");
let scriptMsgDiv = document.querySelector(".script-err-msg-div");

function showAdminMsg(msg, isError = false) {
    if (!scriptMsgDiv) return;
    scriptMsgDiv.innerHTML = msg;
    scriptMsgDiv.style.display = "block";
    scriptMsgDiv.style.color = isError ? "var(--danger)" : "var(--ink)";
    setTimeout(() => {
        scriptMsgDiv.innerHTML = "";
        scriptMsgDiv.style.display = "none";
    }, 8000);
}

if (orderTypeBtnsDiv) {
    orderTypeBtnsDiv.addEventListener("click", (e) => {
        let btn = e.target.closest("button");
        if (!btn) return;
        let id = btn.id;

        document.querySelectorAll(".order-type-btns button").forEach(b => {
            b.classList.toggle("btnActive", b === btn);
        });

        ordersTables.forEach(table => {
            if (table.classList.contains(id)) table.style.display = "block";
            else table.style.display = "none";
        });
    });
}

// Show detail icon (caret toggle)
document.addEventListener("click", (e) => {
    let caret = e.target.closest(".fa-caret-right, .caret-icon");
    if (caret) {
        let card = caret.closest(".orders-card");
        if (card) card.classList.toggle("open");
    }
});

// Order status actions (Mark Done / Mark Delivered)
document.addEventListener("click", (e) => {
    let btn = e.target.closest(".markDoneBtn");
    if (!btn) return;

    let card = btn.closest(".orders-card");
    let orderStatusDiv = card.querySelector(".orderStatus");
    let orderStatus = orderStatusDiv.dataset.orderstatus;

    if (orderStatus === "preparing") {
        fetch(`/Mensa.app/canteen/${slug}/orders/${card.dataset.orderid}/ready`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" }
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                btn.innerHTML = "Mark delivered";
                orderStatusDiv.dataset.orderstatus = "ready";
                orderStatusDiv.textContent = "ready";
            }
            showAdminMsg(res.msg);
        })
        .catch(err => console.error("Order ready error:", err));

    } else if (orderStatus === "ready") {
        fetch(`/Mensa.app/canteen/${slug}/orders/${card.dataset.orderid}/delivered`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" }
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                let type = card.dataset.ordertype;
                if (type === "hostel") {
                    let countEl = document.querySelector("#hostelCountNum");
                    if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
                } else if (type === "queue") {
                    let countEl = document.querySelector("#queueCountNum");
                    if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
                } else if (type === "slot") {
                    let countEl = document.querySelector("#slotCountNum");
                    if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
                }
                card.remove();
            }
            showAdminMsg(res.msg);
        })
        .catch(err => console.error("Order delivered error:", err));
    }
});

// User Moderation: Flag User
document.addEventListener("click", (e) => {
    let flagBtn = e.target.closest(".btn-flag-user");
    if (!flagBtn) return;

    let modRow = flagBtn.closest(".user-moderation-row");
    let userId = modRow ? modRow.dataset.userid : null;
    if (!userId) return;

    flagBtn.disabled = true;
    fetch(`/Mensa.app/canteen/${slug}/users/${userId}/flag`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
    })
    .then(res => res.json())
    .then(res => {
        flagBtn.disabled = false;
        if (res.success) {
            let newCount = res.flagCnt;
            // Update flag count in all moderation rows for this user
            document.querySelectorAll(`.user-moderation-row[data-userid="${userId}"] .card-flag-num`).forEach(el => {
                el.textContent = newCount;
            });
            // Update flag value in order info meta lines
            document.querySelectorAll(`.user-flag-cnt-val[data-userid="${userId}"]`).forEach(el => {
                el.textContent = newCount;
            });
            // Update or reveal flag badge on order summary rows
            document.querySelectorAll(`.order-flag-badge[data-userid="${userId}"]`).forEach(badge => {
                badge.classList.remove("d-none");
                if (!res.isBlocked) {
                    let textSpan = badge.querySelector(".flag-text");
                    if (textSpan) textSpan.textContent = newCount + ' Flag' + (newCount > 1 ? 's' : '');
                }
            });
            // Highlight orders cards
            document.querySelectorAll(`.orders-card`).forEach(c => {
                let mod = c.querySelector(`.user-moderation-row[data-userid="${userId}"]`);
                if (mod) c.classList.add("flagged-card-highlight");
            });
        }
        showAdminMsg(res.msg);
    })
    .catch(err => {
        flagBtn.disabled = false;
        console.error("Flag user error:", err);
    });
});

// User Moderation: Block / Unblock User
document.addEventListener("click", (e) => {
    let blockBtn = e.target.closest(".btn-block-user");
    if (!blockBtn) return;

    let modRow = blockBtn.closest(".user-moderation-row");
    let userId = modRow ? modRow.dataset.userid : null;
    if (!userId) return;

    let willBlock = !blockBtn.classList.contains("btn-unblock");
    let actionWord = willBlock ? "block" : "unblock";

    if (!confirm(`Are you sure you want to ${actionWord} this student from placing orders at this canteen?`)) {
        return;
    }

    blockBtn.disabled = true;
    fetch(`/Mensa.app/canteen/${slug}/users/${userId}/toggle-block`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
    })
    .then(res => res.json())
    .then(res => {
        blockBtn.disabled = false;
        if (res.success) {
            let isBlocked = res.isBlocked;
            // Update all block buttons for this user
            document.querySelectorAll(`.user-moderation-row[data-userid="${userId}"] .btn-block-user`).forEach(btn => {
                btn.classList.toggle("btn-unblock", isBlocked);
                btn.classList.toggle("btn-block", !isBlocked);
                let icon = btn.querySelector("i");
                if (icon) icon.className = isBlocked ? "fa-solid fa-unlock" : "fa-solid fa-ban";
                let text = btn.querySelector(".block-btn-text");
                if (text) text.textContent = isBlocked ? "Unblock student" : "Block student";
            });

            // Update blocked status lines in detail view
            document.querySelectorAll(`.user-blocked-status-line[data-userid="${userId}"]`).forEach(line => {
                line.classList.toggle("d-none", !isBlocked);
            });

            // Update badge in order summary row
            document.querySelectorAll(`.order-flag-badge[data-userid="${userId}"]`).forEach(badge => {
                badge.classList.remove("d-none");
                badge.classList.toggle("is-blocked", isBlocked);
                let icon = badge.querySelector("i");
                if (icon) icon.className = isBlocked ? "fa-solid fa-ban" : "fa-solid fa-flag";
                let text = badge.querySelector(".flag-text");
                if (text) text.textContent = isBlocked ? "Blocked" : (res.flagCnt + ' Flag' + (res.flagCnt > 1 ? 's' : ''));
            });
        }
        showAdminMsg(res.msg);
    })
    .catch(err => {
        blockBtn.disabled = false;
        console.error("Block user error:", err);
    });
});