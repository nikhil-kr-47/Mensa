const express=require("express");
const router=express.Router({mergeParams:true});
const {orderStatus,placeOrder}=require("../controllers/order");
const {wrapAsync}=require("../middlewares/wrapAsync");
const {isLoggedIn,checkAdmin,checkCanteen,checkActiveCanteen}=require("../middlewares/checks");

router.route("/")
.post(isLoggedIn,checkCanteen,checkActiveCanteen,wrapAsync(placeOrder));

router.route("/:orderId/:status")
.patch(isLoggedIn,checkAdmin,checkCanteen,checkActiveCanteen,wrapAsync(orderStatus));  
module.exports={orderRoute:router};