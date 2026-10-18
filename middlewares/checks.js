const ExpressError=require("../utils/ExpressError");
const Canteen=require("../models/canteen");
function checkAdmin(req,res,next){
    if(req.isAuthenticated() && req.user.role.includes("admin")) return next();
    else{
        req.flash("error","Acess Denied");
        res.redirect("/Mensa.app");
    }
}

function checkSuperAdmin(req,res,next){
    if(req.isAuthenticated() && req.user.role.includes("superAdmin")) return next();
    else{
        req.flash("error","Access denied");
        res.redirect("/Mensa.app");
    }
}

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()) return next();
    if (req.xhr || (req.headers.accept && req.headers.accept.includes("json")) || (req.headers["content-type"] && req.headers["content-type"].includes("application/json"))) {
        return res.status(401).json({ success: false, msg: "You must be logged in to perform this action." });
    }
    let slug = req.params.slug;
    req.flash("error", "You must be logged in to access this page.");
    if(slug) {
        return res.redirect(`/Mensa.app/canteen/${slug}`);
    }
    return res.redirect("/Mensa.app");
}

async function checkCanteen(req,res,next){
    let slug=req.params.slug;
    if(!slug) throw new ExpressError(404,"Incorrect request");
    
    let canteen=await Canteen.findOne({slug});
    if(!canteen) throw new ExpressError(404,"Canteen not found");

    next();

}

async function checkActiveCanteen(req,res,next) {
    let slug=req.params.slug;
    if(!slug) throw new ExpressError(404,"Incorrect request.");

    let canteen=await Canteen.findOne({slug});
    if(!canteen){
        throw new ExpressError(404,"Canteen not found.");
    }

    if(!canteen.isActive){
        throw new ExpressError(404,"Your canteen is not active.");
    }
    req.canteen=canteen;
    next();
}



module.exports={checkAdmin,checkSuperAdmin,isLoggedIn,checkCanteen,checkActiveCanteen};