const ExpressError = require("../utils/ExpressError");
const Canteen=require("../models/canteen");
const Menu=require("../models/menuItems");

module.exports.getCart=async(req,res,next)=>{
    let slug=req.params.slug;
    let canteen=await Canteen.findOne({slug});
    if(!canteen) throw new ExpressError(404,"Canteen not found.");

    if(req.user && !req.user.role.includes("user")){
        req.flash("error","Cart is only accessible to student accounts.");
        return res.redirect(`/Mensa.app/canteen/${slug}/dashboard/admin`);
    }

    let cart=req.session.cart || [];
    let total=0;

    for(let cartItem of cart){
        total+=cartItem.price*cartItem.quantity;
    }

    return res.render("cart/cart",{clgName:canteen.clgName,slug,cart,total});
}

module.exports.addItem=async(req,res,next)=>{
    if(!req.user || !req.user.role.includes("user")){
        return res.json({ success:false, msg:"Please log in with a student account to use the cart." });
    }

    let slug=req.params.slug;
    let canteen=await Canteen.findOne({slug});
    if(!canteen) return res.json({ success:false, msg:"Canteen not found." });
    
    let item=await Menu.findOne({_id:req.body.menuItemId});
    if(!item || !item.canteen.equals(canteen._id)){
        return res.json({
            success:false,
            msg:"Item doesn't exist."
        });
    }

    let action=req.params.action || "add";
    if(!["add", "increase", "decrease", "remove"].includes(action)){
        return res.json({
            success:false,
            msg:"Incorrect request"
        });
    }

    if(action === "add" && !item.isAvailable){
       return res.json({
            success:false,
            msg:"Item is out of stock."
        });
    }

    if(!req.session.cart) req.session.cart=[];
    let itemIndex = req.session.cart.findIndex(
        cartItem => String(cartItem.menuItemId) === String(item._id)
    );

    let count = 0;
    let subtotal = 0;

    if(action === "add"){
        if(itemIndex !== -1){
            req.session.cart[itemIndex].quantity += 1;
            count = req.session.cart[itemIndex].quantity;
            subtotal = req.session.cart[itemIndex].price * count;
        } else {
            req.session.cart.push({
                menuItemId: item._id,
                name: item.name,
                price: item.price,
                quantity: 1
            });
            count = 1;
            subtotal = item.price;
        }
    } else if(action === "increase"){
        if(itemIndex !== -1){
            req.session.cart[itemIndex].quantity += 1;
            count = req.session.cart[itemIndex].quantity;
            subtotal = req.session.cart[itemIndex].price * count;
        }
    } else if(action === "decrease"){
        if(itemIndex !== -1){
            req.session.cart[itemIndex].quantity -= 1;
            if(req.session.cart[itemIndex].quantity <= 0){
                req.session.cart.splice(itemIndex, 1);
                count = 0;
                subtotal = 0;
            } else {
                count = req.session.cart[itemIndex].quantity;
                subtotal = req.session.cart[itemIndex].price * count;
            }
        }
    } else if(action === "remove"){
        if(itemIndex !== -1){
            req.session.cart.splice(itemIndex, 1);
            count = 0;
            subtotal = 0;
        }
    }
    
    let total = req.session.cart.reduce((sum, cartItem) => sum + (cartItem.price * cartItem.quantity), 0);
    let totalCount = req.session.cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

    return res.json({
        success: true,
        msg: "Cart updated.",
        cartCount: totalCount,
        count,
        subtotal,
        total,
        removed: count === 0,
        isEmpty: req.session.cart.length === 0
    });
}
