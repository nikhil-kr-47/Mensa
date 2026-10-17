
//Password confirmation
let newPassword=document.querySelector("#new-pass");
let confirmNewPassword=document.querySelector("#confirm-new-pass");
let passwordResetBtn=document.querySelector("#reset-password-btn");
let msgField=document.querySelector(".msgField");
if(newPassword && confirmNewPassword){

    newPassword.addEventListener("input",()=>{
      if(newPassword.value!==confirmNewPassword.value){
        if (msgField) msgField.textContent="Password didn't match";
        if (passwordResetBtn) passwordResetBtn.disabled=true;
      }
      else{
        if (msgField) msgField.textContent="";
        if (passwordResetBtn) passwordResetBtn.disabled=false;
      }
  });

confirmNewPassword.addEventListener("input",()=>{
  if(newPassword.value!==confirmNewPassword.value){
    if (msgField) msgField.textContent="Password didn't match";
    if (passwordResetBtn) passwordResetBtn.disabled=true;
  }
  else{
    if (msgField) msgField.textContent="";
    if (passwordResetBtn) passwordResetBtn.disabled=false;
  }
});
}

//Hamburger control
let hamIcon=document.querySelector(".ham-icon");
let toggleRegBtnDiv=document.querySelector(".reg-btn-div");
if(hamIcon && toggleRegBtnDiv){
  hamIcon.addEventListener("click",()=>{
    if(toggleRegBtnDiv.style.display==="none") toggleRegBtnDiv.style.display="block";
    else toggleRegBtnDiv.style.display="none";
  });
}

//Disabling the resend otp button for some time after last send
const coolDownTime=60*1000;
let lastUpdatedTime=document.querySelector("#otpLastUpdatedAt")?.value;
let resendOtpBtn=document.querySelector(".otp-resend-btn");
if(resendOtpBtn && lastUpdatedTime){
  function handleResendBtn() {
    let remaining = Number(lastUpdatedTime) + coolDownTime - Date.now();
 console.log(remaining);
    if (remaining > 0) {
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = `Wait ${Math.ceil(remaining / 1000)}s`;  //Not math.floor because math.ceil return smallest equal or greater integer, so if 0.4 secs left it will show 1sec
        setTimeout(handleResendBtn, 1000);
    } else {
        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = "Resend";
    }
}
handleResendBtn();
}

//Toggle ball movement

let toggleBtn=document.querySelectorAll(".toggle-btn");
if(toggleBtn){
  toggleBtn.forEach((btn)=>{
    let toggleBall=btn.querySelector(".toggle-ball");
    let liveCntDiv=document.querySelector("#liveCnt");
    let pausedCntDiv =document.querySelector("#pausedCnt");
    btn.addEventListener("click",()=>{
       fetch("/Mensa.app/activeToggle",{
        method:'POST',
        body:JSON.stringify({
          email:btn.dataset.email
        }),
        headers:{
          "Content-Type":"application/json"
        }
       }).then(res=>res.json())
       .then(res=>{
        if(res.success){
          toggleBall.classList.toggle("toggle-ball-active");
          toggleBall.classList.toggle("toggle-ball-pause");
          liveCntDiv.textContent=res.liveCnt;
          pausedCntDiv.textContent=res.pausedCnt
        }
       }).catch(err=>console.log(err));
     })
  })
}

//Sign up / Log in form toggle
let signupLoginBtnDiv=document.querySelector(".sign-log-btn-div");
let loginForm=document.querySelector(".login-form");
let signupForm=document.querySelector(".signup-form");
let signupChoiceBtn=document.querySelector("#signUpChoiceBtn");
let loginChoiceBtn=document.querySelector("#logInChoiceBtn");

function showLoginTab() {
  if (loginForm) loginForm.style.display = "block";
  if (signupForm) signupForm.style.display = "none";
  if (loginChoiceBtn) {
    loginChoiceBtn.classList.add("active");
    loginChoiceBtn.style.borderBottom = "3px solid var(--accent)";
  }
  if (signupChoiceBtn) {
    signupChoiceBtn.classList.remove("active");
    signupChoiceBtn.style.borderBottom = "3px solid transparent";
  }
}

function showSignupTab() {
  if (signupForm) signupForm.style.display = "block";
  if (loginForm) loginForm.style.display = "none";
  if (signupChoiceBtn) {
    signupChoiceBtn.classList.add("active");
    signupChoiceBtn.style.borderBottom = "3px solid var(--accent)";
  }
  if (loginChoiceBtn) {
    loginChoiceBtn.classList.remove("active");
    loginChoiceBtn.style.borderBottom = "3px solid transparent";
  }
}

if (signupLoginBtnDiv && signupChoiceBtn && loginChoiceBtn) {
  signupLoginBtnDiv.addEventListener("click", (e) => {
    let btn = e.target.closest("button");
    if (!btn) return;
    if (btn.id === "signUpChoiceBtn") {
      showSignupTab();
      if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
      }
    } else if (btn.id === "logInChoiceBtn") {
      showLoginTab();
      window.location.hash = "login";
    }
  });

  function handleAuthHash() {
    if (window.location.hash === "#login") {
      showLoginTab();
    } else if (window.location.hash === "#signup") {
      showSignupTab();
    }
  }

  handleAuthHash();
  window.addEventListener("hashchange", handleAuthHash);
}

//Login controller
let userLoginChoiceBtn=document.querySelector("#userLoginChoiceBtn");
let adminLoginChoiceBtn=document.querySelector("#adminLoginChoiceBtn");

if (userLoginChoiceBtn && adminLoginChoiceBtn && loginForm) {
  userLoginChoiceBtn.addEventListener("click", () => {
    loginForm.action = `/Mensa.app/canteen/${slug}/users/login/user`;
    userLoginChoiceBtn.classList.add("active");
    adminLoginChoiceBtn.classList.remove("active");
    userLoginChoiceBtn.style.borderBottom = "3px solid var(--accent)";
    adminLoginChoiceBtn.style.borderBottom = "3px solid transparent";
  });
  adminLoginChoiceBtn.addEventListener("click", () => {
    loginForm.action = `/Mensa.app/canteen/${slug}/users/login/admin`;
    adminLoginChoiceBtn.classList.add("active");
    userLoginChoiceBtn.classList.remove("active");
    adminLoginChoiceBtn.style.borderBottom = "3px solid var(--accent)";
    userLoginChoiceBtn.style.borderBottom = "3px solid transparent";
  });
}


//Super admin actions
let superAdminActionBtn=document.querySelectorAll(".superAdminActionBtn");

if(superAdminActionBtn && superAdminActionBtn.length){
  superAdminActionBtn.forEach(btn=>{
    btn.addEventListener("click", () => {
      let form = btn.closest(".approveRejectForm");
      let card = btn.closest(".cant-req-card");
      let action = btn.value; // "reject" or "approve"

      fetch(`/Mensa.app/registerCanteen/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.elements.email.value,
          slug: form.elements.slug.value
        })
      })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          card.remove(); // instantly removes the request card from the DOM
        } 
          alert(res.msg); // surface the failure — currently silently logged only
        
      })
      .catch(err => console.log(err));
    });
  });
}

// Flash & message box dismiss control (Event delegation)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-close, .alert-close");
  if (btn) {
    const alertBox = btn.closest(".alert-container") || btn.closest(".alert") || btn.closest(".toast-alert") || btn.closest(".script-err-msg-div");
    if (alertBox) {
      alertBox.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      alertBox.style.opacity = "0";
      alertBox.style.transform = "translateY(-6px)";
      setTimeout(() => {
        if (alertBox.classList && alertBox.classList.contains("script-err-msg-div")) {
          alertBox.style.display = "none";
          alertBox.innerHTML = "";
        } else {
          alertBox.remove();
        }
      }, 200);
    }
  }
});

// Auto-dismiss flash alerts after 6 seconds
setTimeout(() => {
  document.querySelectorAll(".alert-container").forEach(el => {
    el.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    el.style.opacity = "0";
    el.style.transform = "translateY(-4px)";
    setTimeout(() => { el.remove(); }, 400);
  });
}, 6000);

//Delivery mode / order type / slot selection
let deliveryMode = document.querySelector("#deliveryMode");
let orderTypeDiv = document.querySelector(".order-type-div");

if (deliveryMode) {
    deliveryMode.addEventListener("change", () => {
        orderTypeDiv.style.display = deliveryMode.value === "hostel" ? "none" : "block";
    });
}

let orderType = document.querySelector("#orderType");
let slotSelectDiv = document.querySelector(".slot-select-div");
let slotOption = document.querySelector("#slot");



if (orderType) {
    orderType.addEventListener("change", () => {
        if (orderType.value === "slot") {
            slotOption.disabled = false;
            slotSelectDiv.style.display = "block";
        } else {
            slotSelectDiv.style.display = "none";
            slotOption.disabled = true;
        }
    });
}
