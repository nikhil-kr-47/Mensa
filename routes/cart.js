const express=require("express");
const {wrapAsync}=require("../middlewares/wrapAsync");
const router=express.Router({mergeParams:true});

const {checkCanteen,isLoggedIn,checkActiveCanteen}=require("../middlewares/checks");
const {getCart,addItem}=require("../controllers/cart");


router.use(isLoggedIn,checkCanteen,checkActiveCanteen);
router.route("/")
.get(getCart);

router.route("/:action")
.post(addItem)
.patch(addItem);

module.exports={cartRoute:router};
