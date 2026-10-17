const express=require("express");
const router=express.Router({mergeParams:true});
const {wrapAsync}=require("../middlewares/wrapAsync");
const {isLoggedIn,checkAdmin,checkCanteen,checkActiveCanteen}=require("../middlewares/checks");

const {getMenu,getMenuForm,createItem,editMenuForm,postEditItem,deleteItem,toggleAvailability}=require("../controllers/menu");

router.route("/:type")
.get(isLoggedIn,checkAdmin,checkCanteen,checkActiveCanteen,wrapAsync(getMenu));

router.route("/:type/new")
.get(isLoggedIn,checkAdmin,checkCanteen,checkActiveCanteen,wrapAsync(getMenuForm))
.post(isLoggedIn,checkAdmin,checkCanteen,wrapAsync(createItem));

router.route("/:type/:itemId")
.delete(isLoggedIn,checkAdmin,checkCanteen,checkActiveCanteen,wrapAsync(deleteItem));

router.route("/:type/:itemId/edit")
.get(isLoggedIn,checkAdmin,checkCanteen,checkActiveCanteen,wrapAsync(editMenuForm))
.put(checkCanteen,wrapAsync(postEditItem));

router.route("/:type/:itemId/toggle")
.patch(isLoggedIn,checkAdmin,checkCanteen,checkActiveCanteen,wrapAsync(toggleAvailability));



module.exports={menuRoute:router};