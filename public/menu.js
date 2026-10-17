
document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!confirm("Delete this item permanently?")) return;

        const itemId = btn.dataset.itemId;
        btn.disabled = true;

        fetch(`/Mensa.app/canteen/${slug}/menu/admin/${itemId}`, { method: "DELETE" })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    btn.closest(".menu-row").remove();
                    scriptMsgDiv.innerHTML=`${data.msg}`;
                         scriptMsgDiv.style.display="block";
                         setTimeout(()=>{
                            scriptMsgDiv.innerHTML="";
                            scriptMsgDiv.style.display="none";
                         },1000*20);
                } else {
                    btn.disabled = false;
                   scriptMsgDiv.innerHTML=`${data.msg}`;
                         scriptMsgDiv.style.display="block";
                         setTimeout(()=>{
                            scriptMsgDiv.innerHTML="";
                            scriptMsgDiv.style.display="none";
                         },1000*20);
                }
            })
            .catch(err => {
                console.log(err);
                btn.disabled = false;
                alert("Something went wrong — try again.");
            });
    });
});

// Kebab menu toggle
document.querySelectorAll(".kebab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const menu = btn.closest(".kebab-wrap")?.querySelector(".kebab-menu");
        document.querySelectorAll(".kebab-menu.show").forEach(m => {
            if (m !== menu) m.classList.remove("show");
        });
        if (menu) menu.classList.toggle("show");
    });
});

document.addEventListener("click", () => {
    document.querySelectorAll(".kebab-menu.show").forEach(m => m.classList.remove("show"));
});

document.querySelectorAll(".avail-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
        const itemId = btn.dataset.itemId;
        btn.disabled = true;

        fetch(`/Mensa.app/canteen/${slug}/menu/admin/${itemId}/toggle`, { method: "PATCH" })
            .then(res => res.json())
            .then(data => {
                // console.log("RESPONSE:", data);  
                if (data.success) {
                    btn.classList.toggle("off", !data.isAvailable);
                    scriptMsgDiv.innerHTML=`${data.msg}`;
                         scriptMsgDiv.style.display="block";
                         setTimeout(()=>{
                            scriptMsgDiv.innerHTML="";
                            scriptMsgDiv.style.display="none";
                         },1000*20);
                } else {
                    scriptMsgDiv.innerHTML=`${data.msg}`;
                         scriptMsgDiv.style.display="block";
                         setTimeout(()=>{
                            scriptMsgDiv.innerHTML="";
                            scriptMsgDiv.style.display="none";
                         },1000*20);
                }
            })
            .catch(err => {
                console.log(err);
                alert("Something went wrong — try again.");
            })
            .finally(() => {
                btn.disabled = false;
            });
    });
});

//User menu
document.querySelectorAll(".cat-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const cat = tab.dataset.category;
        document.querySelectorAll(".item-card").forEach(card => {
            card.style.display = (cat === "all" || card.dataset.category === cat) ? "flex" : "none";
        });
    });
});

document.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        btn.disabled = true;
        fetch(`/Mensa.app/canteen/${slug}/cart/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ menuItemId: btn.dataset.itemId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success){
               document.querySelectorAll("#cartBadge, .cart-badge, .cart-pill-count").forEach(el => el.textContent = data.cartCount);
               console.log("added");
            } else {
               const msgBox = document.querySelector(".script-err-msg-div");
               if (msgBox) {
                   msgBox.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:12px;"><span><i class="fa-solid fa-triangle-exclamation"></i> ${data.msg || "Please log in to add items to your cart."}</span> <a href="/Mensa.app/canteen/${slug}" class="btn-primary btn-sm" style="height:32px;padding:0 12px;font-size:13px;">Log in</a></div>`;
                   msgBox.style.display = "block";
                   setTimeout(() => { msgBox.style.display = "none"; }, 6000);
               }
            }
            btn.disabled = false;
        })
        .catch(err => {
            console.log(err);
            const msgBox = document.querySelector(".script-err-msg-div");
            if (msgBox) {
                msgBox.innerHTML = `<span><i class="fa-solid fa-triangle-exclamation"></i> Something went wrong — please try again.</span>`;
                msgBox.style.display = "block";
                setTimeout(() => { msgBox.style.display = "none"; }, 5000);
            }
            btn.disabled = false;
        });
    });
});