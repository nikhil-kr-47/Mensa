
const ExpressError=require("../utils/ExpressError");
const Order=require("../models/order");
const Canteen=require("../models/canteen");
const User=require("../models/user");

module.exports.orderStatus=async(req,res,next)=>{
   console.log("1");
   let slug=req.params.slug;
   if(!slug) throw new ExpressError(404,"Your canteen doesn't exist.");

   let orderId=req.params.orderId;
   if(!orderId){
      return res.json({
         success:false,
         msg:"Incorrect order id."
      });
   }

   let status=req.params.status;
   if(!status){
      return res.json({
         success:false,
         msg:"Incorrect order status request."
      });
   }
   if(!["ready","delivered"].includes(status)){
      return res.json({
         success:false,
         msg:"Incorrect order status request."
      });
   }

   let canteen=await Canteen.findOne({slug});
   if(!canteen) throw new ExpressError(404,"Your canteen doesn't exist.");

   let order=await Order.findById(orderId);
   if(!order){
      return res.json({
         success:false,
         msg:"Order not found."
      });
   }

   if(!order.canteen.equals(canteen._id)){
      return res.json({
         success:false,
         msg:"This orderId belongs to another canteen."
      });
   }

   
      order.status=status;
      await order.save();
      return res.json({
         success:true,
         msg:"Status updated successfully."
      });

}

module.exports.placeOrder=async(req,res,next)=>{
    let slug=req.params.slug;
    let canteen=await Canteen.findOne({slug});
    if(!canteen) throw new ExpressError(404,"Your canteen doesn't exist.");

    let cart=req.session.cart || [];
    if(cart.length===0){
        req.flash("error","Your cart is empty.");
        return res.redirect(`/Mensa.app/canteen/${slug}/dashboard/user`);
    }

    let user = req.user;
    if(!user){
        if(req.isAuthenticated && req.isAuthenticated()){
            user = req.user;
        }
    }

    if(!user){
        if(process.env.NODE_ENV !== "production"){
            user = await User.findOne({ canteen: canteen._id, role: "user" });
            if(!user){
                user = await User.findOne({ canteen: canteen._id });
            }
            if(!user){
                user = new User({
                    username: "Student",
                    email: `student_${canteen.slug}@campusbites.local`,
                    phoneNo: "9876543210",
                    role: ["user"],
                    isVerified: true,
                    canteen: canteen._id
                });
                await User.register(user, "password123");
            }
            await new Promise((resolve, reject) => {
                req.login(user, (err) => {
                    if(err) return reject(err);
                    resolve();
                });
            });
        } else {
            req.flash("error", "Please login to place your order.");
            return res.redirect(`/Mensa.app/canteen/${slug}`);
        }
    }

    if(user && user.isBlocked){
        req.flash("error", "Your account has been blocked by the canteen admin. You cannot place orders.");
        return res.redirect(`/Mensa.app/canteen/${slug}`);
    }

    let {deliveryMode,orderType,slot,roomNo}=req.body;

    let finalOrderType="queue";
    if(deliveryMode==="hostel"){
        finalOrderType="hostel";
        if(!roomNo || roomNo.trim()===""){
            if(process.env.NODE_ENV !== "production"){
                roomNo = "Room 101";
            } else {
                req.flash("error","Please provide a room number for hostel delivery.");
                return res.redirect(`/Mensa.app/canteen/${slug}/cart`);
            }
        }
    } else {
        if(orderType==="slot"){
            finalOrderType="slot";
        } else {
            finalOrderType="queue";
        }
    }

    let items=cart.map(i=>({
        name:i.name,
        price:i.price,
        quantity:i.quantity
    }));

    let total=cart.reduce((sum,i)=>sum+(i.price*i.quantity),0);

    const startOfDay=new Date();
    startOfDay.setHours(0,0,0,0);
    const todayOrdersCount=await Order.countDocuments({
        canteen:canteen._id,
        createdAt:{$gte:startOfDay}
    });
    const tokenNo=todayOrdersCount+1;

    const newOrder=new Order({
        canteen:canteen._id,
        user:user._id,
        items,
        total,
        orderType:finalOrderType,
        tokenNo,
        status:"preparing",
        slotTime:finalOrderType==="slot"?(slot || "12:30 PM"):undefined,
        roomNo:finalOrderType==="hostel"?roomNo.trim():undefined
    });

    await newOrder.save();

    req.session.activeOrderId = newOrder._id;
    req.session.cart=[];

    req.flash("success",`Order placed successfully! Token #${tokenNo}`);
    return res.redirect(`/Mensa.app/canteen/${slug}/dashboard/user`);
};
