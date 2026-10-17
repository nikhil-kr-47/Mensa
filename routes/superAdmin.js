const {getSuperAdmin,getSuperAdminAuth,postSuperAdmin}=require("../controllers/superAdmin");
const express=require("express");
const router=express.Router({mergeParams:true});
const {wrapAsync}=require("../middlewares/wrapAsync");
const passport=require("passport");
const{checkSuperAdmin}=require("../middlewares/checks");


router.route("/")
.get(getSuperAdminAuth)
.post(passport.authenticate("local",{failureRedirect:"/Mensa.app/superAdmin"}),wrapAsync(postSuperAdmin));

router.route("/get")
.get(checkSuperAdmin,wrapAsync(getSuperAdmin));

module.exports={superAdminRoute:router};