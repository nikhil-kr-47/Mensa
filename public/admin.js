let orderTypeBtnsDiv=document.querySelector(".order-type-btns");
let hostelOrderBtn=document.querySelector("#hostelOrderBtn");
let queueOrderBtn=document.querySelector("#queueOrderBtn");
let slotOrderBtn=document.querySelector("#slotOrderBtn");
let ordersTables=document.querySelectorAll(".ordersTable>div");
let scriptMsgDiv=document.querySelector(".script-err-msg-div");
console.log(scriptMsgDiv);

if(orderTypeBtnsDiv){
orderTypeBtnsDiv.addEventListener("click",(e)=>{
    console.log(e.target.id);
    hostelOrderBtn.classList.toggle("btnActive",e.target.id==="hostelOrderBtn");
    queueOrderBtn.classList.toggle("btnActive",e.target.id==="queueOrderBtn");
    slotOrderBtn.classList.toggle("btnActive",e.target.id==="slotOrderBtn");
    ordersTables.forEach(table=>{
        if(table.classList.contains(e.target.id)) table.style.display="block";
        else table.style.display="none";
    });
});
}

//Show detail icon
document.querySelectorAll(".fa-caret-right").forEach(caret => {
    caret.addEventListener("click", () => {
        caret.closest(".orders-card").classList.toggle("open");
    });
});

//Order actions
let markDoneBtn=document.querySelectorAll(".markDoneBtn");

if(markDoneBtn && markDoneBtn.length){
    markDoneBtn.forEach(btn=>{
        btn.addEventListener("click",()=>{
            let card=btn.closest(".orders-card");
            let orderStatusDiv=card.querySelector(".orderStatus");
            // console.log(orderStatusDiv);
            let orderStatus=orderStatusDiv.dataset.orderstatus;
           
            if(orderStatus==="preparing"){
                fetch(`/Mensa.app/canteen/${slug}/orders/${card.dataset.orderid}/ready`,{
                    method:"PATCH",
                    headers:{
                        "Content-Type":"application/json"
                    }
                }).then(res=>res.json())
                .then(res=>{
                     if(res.success){
                        btn.innerHTML="Mark Delivered";
                        orderStatusDiv.dataset.orderstatus="ready";
                     }
                         scriptMsgDiv.innerHTML=`${res.msg}`;
                         scriptMsgDiv.style.display="block";
                         setTimeout(()=>{
                            scriptMsgDiv.innerHTML="";
                            scriptMsgDiv.style.display="none";
                         },1000*20);
                     
                }).catch(err=>console.log(err));
                
            }else if(orderStatus==="ready"){
                fetch(`/Mensa.app/canteen/${slug}/orders/${card.dataset.orderid}/delivered`,{
                    method:"PATCH",
                    headers:{
                        "Content-Type":"application/json"
                    }
                }).then(res=>res.json())
                .then(res=>{
                    if(res.success){
                        let type = card.dataset.ordertype;
                        if(type === "hostel"){
                            let countEl = document.querySelector("#hostelCountNum");
                            if(countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
                        } else if(type === "queue"){
                            let countEl = document.querySelector("#queueCountNum");
                            if(countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
                        } else if(type === "slot"){
                            let countEl = document.querySelector("#slotCountNum");
                            if(countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
                        }
                        card.remove();
                    }
                    scriptMsgDiv.innerHTML=`${res.msg}`;
                    scriptMsgDiv.style.display="block";
                    setTimeout(()=>{
                       scriptMsgDiv.innerHTML="";
                       scriptMsgDiv.style.display="none";
                    },1000*20);
                }).catch(err=>console.log(err));
            }
        })
    })
}