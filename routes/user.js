const express=require("express");
const router=express.Router({mergeParams:true});
const passport=require('passport');

const {postUserLogin,postUserSignup,userLogout,flagUser,toggleBlockUser}=require("../controllers/user");
const {userValidate}=require("../middlewares/joiValidate");
const {wrapAsync}=require("../middlewares/wrapAsync");
const {isLoggedIn,checkActiveCanteen,checkCanteen,checkAdmin}=require("../middlewares/checks");

router.route("/logout")
.get(isLoggedIn,wrapAsync(userLogout))
.post(isLoggedIn,wrapAsync(userLogout));

router.route("/signup/user")
.post(checkCanteen,checkActiveCanteen,userValidate,wrapAsync(postUserSignup));

router.route("/login/:type")
.post(checkCanteen,checkActiveCanteen,postUserLogin);

router.route("/:userId/flag")
.patch(isLoggedIn,checkAdmin,checkCanteen,checkActiveCanteen,wrapAsync(flagUser));

router.route("/:userId/toggle-block")
.patch(isLoggedIn,checkAdmin,checkCanteen,checkActiveCanteen,wrapAsync(toggleBlockUser));

module.exports={userRoute:router};