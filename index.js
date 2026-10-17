// console.log("1");
const express=require("express");
if(process.env.NODE_ENV!="production"){require('dotenv').config();}
// console.log("1");
const app=express();
// console.log("1");

const coolDownTime=60*1000;
const maxOtpFreq=3;
const path=require("path");
const engine=require("ejs-mate");
const crypto=require("crypto");

app.use(express.static(path.join(__dirname,"public")));
//  console.log(process.env.DB_URL);


const {cantReqValidate}=require("./middlewares/joiValidate");
const {wrapAsync}=require("./middlewares/wrapAsync");
const mailSend=require("./utils/handleEmail");

const genUrl=require("./utils/generateUrl");

const genResetToken=require("./utils/genResetToken");

const {superAdminRoute}=require("./routes/superAdmin");
const {userRoute}=require("./routes/user");
const {orderRoute}=require("./routes/orders");

const CantReq = require("./models/cantRequests");
const Canteen=require("./models/canteen");
const User=require("./models/user");
const Order=require("./models/order");
const Menu=require("./models/menuItems");

const session=require("express-session");
const MongoStore = require('connect-mongo').default;
const flash=require("connect-flash");
// const cookieParser=require("cookie-parser");
const passport=require("passport");
const localStrategy=require("passport-local");
const ExpressError=require("./utils/ExpressError")
const mongoose=require("mongoose");

const {checkSuperAdmin,checkAdmin,isLoggedIn,checkActiveCanteen,checkCanteen}=require("./middlewares/checks");

const methOverride=require("method-override");


// const User=require("./models/user");
// const {wrapAsync}=require("./middlewares/wrapAsync");
// const checkLogin=require("./middlewares/checkLogin");
const {cartRoute}=require("./routes/cart");
// const userRoute=require("./routes/user");
const {menuRoute}=require("./routes/menu");

// const orderRoute=require("./routes/orders");
// const adminRoute=require("./routes/admin");



app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.engine("ejs",engine);


//Sessions
app.use(session({
    secret: 'vhvgfdfghh',
    resave: false,
    saveUninitialized: false,
    // store: MongoStore.create({
    //     mongoUrl:process.env.DB_URL,
    //     ttl: 24 * 60 * 60 //time-to-live
    //   }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV==="production",
        maxAge: 24*60*60*1000
      },
     }
  ));
  

app.use(passport.initialize());
passport.use("local",new localStrategy({usernameField:"email"},User.authenticate()));
app.use(passport.session());  
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(flash());
app.use((req,res,next)=>{
  res.locals.currUser = req.user;
  res.locals.error=req.flash("error");
  res.locals.success=req.flash("success");
  next();
});
  

app.use(methOverride("_method"));
// app.use(cookieParser("jbhjjhdscjhvvs"));

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/CampusBites");
}

main().then(()=>{console.log("Connected to DB")}).catch(err=>console.log(err));


const port=8080;

app.listen(port,()=>{
    console.log(`App is listening on ${port} `);
});

app.get("/Mensa.app",(req,res)=>{
   res.render("landing.ejs");
});

app.get("/Mensa.app/adminRegister",(req,res)=>{
    res.render("users/adminRegForm.ejs");
});

//Admin Register
app.post("/Mensa.app/adminRegister",cantReqValidate,wrapAsync(async(req,res,next)=>{
  let {email,location,clgName,username,phoneNo}=req.body;

  if(!email || !location || !clgName || !username || !phoneNo){
    throw new ExpressError(404,"Incorrect request with not sufficient data");
  }

  let existing=await Canteen.findOne({email}); //If already approved
  if(existing){
    req.flash("error","This email is already in use.");
    return res.redirect("/Mensa.app");
  }

  let doc=await CantReq.findOne({email});
  if(doc){
    if(doc.isVerified){
      req.flash("error","An approval request for this email is already pending.");
      return res.redirect("/Mensa.app");
    }
    if(doc.freqExpireDate.toDateString()!==new Date().toDateString()){  //Compare dates
      doc.otpFreq=0;
      doc.freqExpireDate=new Date();
    } 
    if(doc.otpFreq>=maxOtpFreq){
      req.flash("error","You have reached max limit ot otp for today.");
      return res.redirect("/Mensa.app");
    }
    if(doc.failedAttemptsExpireDate.toDateString()!==new Date().toDateString()){
      doc.otpFailedAttempts=0;
      doc.failedAttemptsExpireDate=new Date();
    }
    if(doc.otpFailedAttempts>=5){
      req.flash("error","You have reached max limit of failed OTP attempts for today.");
      return res.redirect("/Mensa.app");
    }
    doc.clgName=clgName;
    doc.username=username;
    doc.location=location;
    doc.phoneNo=phoneNo;
   await doc.save();
  }
  else{
   doc=new CantReq(req.body);
  }

  req.session.regEmail=doc.email;
  req.session.regType="admin";

  try{
    await mailSend(doc);
  }catch(err){
    req.session.regEmail=undefined;
    req.session.regType=undefined;
    req.flash("error","Cannot send mail. PLease retry after some time.");
    return res.redirect("/Mensa.app");
  }
  return res.redirect(`/Mensa.app/getOtp/admin`);
}));

app.get("/Mensa.app/getOtp/:type",wrapAsync(async(req,res,next)=>{
  let email=req.session.regEmail || undefined;
  if(!email){
    throw new ExpressError(400,"Some error occurred.");
  }

  let regType=req.session.regType || undefined;
  if(!regType)  throw new ExpressError(400,"Some error occurred.");

  let type=req.params.type;
  if(type!==regType)throw new ExpressError(400,"Some error occurred.");

  let otpLastUpdatedAt=undefined;

  if(type==="user") {
    let slug=req.session.slug || undefined;
    if(!slug) throw new ExpressError(400,"Some error occurred.");

    let doc=await User.findOne({email});
    if(!doc) {
      req.flash("error","Some error occurred.");
      return res.redirect(`/Mensa.app/canteen/${slug}/signup`);
    }
    otpLastUpdatedAt=doc.otpUpdatedAt.getTime();
  }else if(type==="admin"){
    let doc=await CantReq.findOne({email});
    if(!doc) {
      req.flash("error","Some error occurred.");
      return res.redirect("/Mensa.app");
    }
    otpLastUpdatedAt=doc.otpUpdatedAt.getTime();
  }else{
    throw new ExpressError(404,"Incorrect request type.");
  }

  res.render("getOtp.ejs",{type,email:email,otpLastUpdatedAt});
}));

//VerifyOtp
app.post("/Mensa.app/otpVerify/:type",wrapAsync(async(req,res,next)=>{
    let {email,otpValue}=req.body;
    if(!email || !otpValue) throw new ExpressError(404,"Incorrect request.");

    let regEmail=req.session.regEmail || undefined;
    if(email!==regEmail)throw new ExpressError(400,"Incorrect request.");

    let slug=req.session.slug || undefined;
   
    let regType=req.session.regType || undefined;
    if(!regType) throw new ExpressError(400,"Some error occurred.");
    
    let type=req.params.type;
    if(type!==regType)throw new ExpressError(400,"Some error occurred.");
    ;
    let Model=undefined;

    if(type==="admin"){  //If admin
        Model=CantReq;
    }else if(type==="user"){
      if(!slug) throw new ExpressError(404,"Incorrect request.");
      Model=User;
    }else{
      throw new ExpressError(404,"Incorrect request type.");
    }
    
    let doc=await Model.findOne({email});
      
    if(!doc){
           req.flash("error","Some error occurred!");
           return res.redirect(type==="admin"?"/Mensa.app":`/Mensa.app/canteen/${slug}`);
    }
    if(doc.otpExpiry<Date.now()){
            req.flash("error","Otp expired.  Please ask for resend after 1 minute of previous mail.");
            return res.redirect(type==="admin"?`/Mensa.app/getOtp/admin`:`/Mensa.app/getOtp/user`);
    }
    if(otpValue.length!==6){
          req.flash("error","Otp must contain 6 digits.");
          return res.redirect(type==="admin"?`/Mensa.app/getOtp/admin`:`/Mensa.app/getOtp/user`);
    }
    if(/[^0-9]/.test(otpValue)){
      req.flash("error","Otp must contain only digits.");
      return res.redirect(type==="admin"?`/Mensa.app/getOtp/admin`:`/Mensa.app/getOtp/user`);
    }
    if(doc.otp!==crypto.createHmac("sha256",process.env.OTP_SECRET).update(otpValue.toString()).digest("hex")){
          doc.otpFailedAttempts++;
          await doc.save();
          if(doc.otpFailedAttempts>=5){
            doc.otp=undefined;
            await doc.save();
            req.flash("error","You have reached max limit of failed OTP attempts for today.");
            return res.redirect(type=="admin"?"/Mensa.app":`/Mensa.app/canteen/${slug}`);
          }
          req.flash("error","Incorrect otp");
         return res.redirect(type==="admin"?`/Mensa.app/getOtp/admin`:`/Mensa.app/getOtp/user`);
    }

    doc.isVerified=true;
    doc.otp=undefined;
    doc.otpExpiry = undefined;
    doc.otpFreq=0;
    doc.otpFailedAttempts=0;
    doc.otpUpdatedAt=undefined;
    doc.failedAttemptsExpireDate=undefined;
    if(type==="admin"){
     doc.slug=genUrl(doc.clgName);
     req.flash("success","Verified! You will hear from us within 48 hours.");
    }else if(type==="user"){
      if(!doc.role.includes("user")) doc.role.push("user");
      req.flash("success","Verification successful.");
    }
    await doc.save();

    if(req.session.regEmail) req.session.regEmail=undefined;
    if(req.session.regType) req.session.regType=undefined;
    if(req.session.slug) req.session.slug=undefined;

    return res.redirect(type==="admin"?"/Mensa.app":`/Mensa.app/canteen/${slug}`);  //requires recheck
}));

//Resend email
app.post("/Mensa.app/resendOtp/:type",wrapAsync(async(req,res,next)=>{
    let{email}=req.body;
    if(!email) throw new ExpressError(400,"Incorrect request.");

    let slug=req.session.slug || undefined;
    let regEmail=req.session.regEmail || undefined;
    
    if(email!==regEmail)throw new ExpressError(400,"Incorrect request.");

    let regType=req.session.regType || undefined;
    if(!regEmail || !regType)throw new ExpressError(400,"Incorrect request.");

    let type=req.params.type;
    if(!type) throw new ExpressError(404,"Incorrect request type.");
    if(type!==regType)throw new ExpressError(400,"Incorrect request."); 

    let Model=undefined;
    if(type==="admin"){
      Model=CantReq;
    }else if(type==="user"){
      Model=User;
      if(!slug)throw new ExpressError(400,"Incorrect request.");
    }else{
      throw new ExpressError(404,"Incorrect request");
    }
       
    let doc=await Model.findOne({email});

    if(!doc){
        req.flash("error","Some error occurred. PLease retry.");
        return res.redirect(type==="admin"?"/Mensa.app":`/Mensa.app/canteen/${slug}`);
    }
    if(doc.freqExpireDate.toDateString()!==new Date().toDateString()){
      doc.otpFreq=0;
      doc.freqExpireDate=new Date();
    } 
    if(doc.otpFreq>=maxOtpFreq){
        req.flash("error","You have reached max limit ot otp for today.");
        return res.redirect(type==="admin"?"/Mensa.app":  `/Mensa.app/canteen/${slug}`); 
    }
    if(Date.now()>doc.otpUpdatedAt.getTime()+coolDownTime){  //To prevent from burning
      try{ 
      await mailSend(doc);
      }catch(err){
        let prevSlug=req.session.slug || undefined;
        req.session.regEmail=undefined;
        req.session.regType=undefined;
        req.session.slug=undefined;
        req.flash("error","Can't send mail. Retry after some time");
        return res.redirect(type==="admin"?"/Mensa.app":`/Mensa.app/canteen/${prevSlug}`);
      }
        return res.redirect(type==="admin"?`/Mensa.app/getOtp/admin`:`/Mensa.app/getOtp/user`);
    }else{
        req.flash("error","Please wait a few seconds before you ask for resend.");
        return res.redirect(type==="admin"?`/Mensa.app/getOtp/admin`:`/Mensa.app/getOtp/user`);
    }
}));


//Super admin
app.use("/Mensa.app/superAdmin",superAdminRoute);

//Users route
app.use("/Mensa.app/canteen/:slug/users",userRoute);

//Orders route
app.use("/Mensa.app/canteen/:slug/orders",orderRoute);

//Cart
app.use("/Mensa.app/canteen/:slug/cart",cartRoute);



app.get(`/Mensa.app/canteen/:slug/dashboard/:type`,checkCanteen,checkActiveCanteen,wrapAsync(async(req,res)=>{
  let [slug,type]=[req.params.slug,req.params.type];
  if(!slug || !type)throw new ExpressError(404,"Incorrect request.");

  if(type!=="admin" && type!=="user")throw new ExpressError(404,"Incorrect request");

  let canteen=req.canteen || await Canteen.findOne({slug});
  if(!canteen) throw new ExpressError(404,"Your canteen doesn't exist.");
  if(type==="admin"){
    if(!req.isAuthenticated() || !req.user.role.includes("admin")){
      req.flash("error","Access Denied");
      return res.redirect(`/Mensa.app/canteen/${slug}`);
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const canteenObjectId = new mongoose.Types.ObjectId(canteen._id);

    let [hostelOrders, queueOrders, slotOrders, revenueAgg, menuCount, menuItems] = await Promise.all([
      Order.find({ canteen: canteen._id, orderType: "hostel", status: { $ne: "delivered" } }).populate("user").sort({ createdAt: -1 }),
      Order.find({ canteen: canteen._id, orderType: "queue", status: { $ne: "delivered" } }).populate("user").sort({ createdAt: -1 }),
      Order.find({ canteen: canteen._id, orderType: "slot", status: { $ne: "delivered" } }).populate("user").sort({ createdAt: -1 }),
      Order.aggregate([
        {
          $match: {
            canteen: canteenObjectId,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" }
          }
        }
      ]),
      Menu.countDocuments({ canteen: canteen._id }),
      Menu.find({ canteen: canteen._id }).sort({ createdAt: -1 })
    ]);

    const hostelCount = hostelOrders.length;
    const queueCount = queueOrders.length;
    const slotCount = slotOrders.length;
    const revenue = revenueAgg.length > 0 && revenueAgg[0].total ? revenueAgg[0].total : 0;

    res.render("adminDashboard.ejs", { hostelCount, queueCount, slotCount, revenue, hostelOrders, queueOrders, slotOrders, menuCount, slug, clgName: canteen.clgName, menuItems });
}else{
  const menuItems=await Menu.find({canteen:canteen._id}).sort({createdAt:-1});
  const cartCount=req.session.cart ? req.session.cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
  let activeOrder=null;
  if(req.session.activeOrderId){
    activeOrder=await Order.findOne({
      _id:req.session.activeOrderId,
      canteen:canteen._id,
      status:{$ne:"delivered"}
    });
    if(!activeOrder){
      req.session.activeOrderId=undefined;
    }
  } else if(req.user){
    activeOrder=await Order.findOne({
      canteen:canteen._id,
      user:req.user._id,
      status:{$ne:"delivered"}
    }).sort({createdAt:-1});
  }
  return res.render("menu/menu",{slug,clgName:canteen.clgName,cartCount,activeOrder,menuItems});
}
}));

// app.get("/dashboard",(req,res)=>{
//   res.render("users/adminDashboard");
// });
app.use("/mensa.app/canteen/:slug/menu",menuRoute);

//Register canteen by Super admin
app.post("/Mensa.app/registerCanteen/:action",checkSuperAdmin,wrapAsync(async(req,res,next)=>{
  // console.log("1");
  let {email,slug}=req.body;
  if(!email){
    return res.json({
      success:false,
      msg:"No email provided"
    })
  }
  if(!slug || slug.trim()===""){
     return res.json({
      success:false,
      msg:"Invalid slug"
    });
  }

  let resMsg,resStatus; //For sending json res

  let action=req.params.action;
  if(!action){
    return res.json({
      success:false,
      msg:"Incorrect request"
    });
  }

  // //Creating transactions to make the operations atommic    .. But works only if replica is maintained
  // const transSession=await mongoose.startSession();

  if(action==="approve"){
    let existing=await Canteen.findOne({email})//Check if canteen with this mail already exists
  if(existing){
    return res.json({
      success:false,
      msg:"This canteen alreday exists."
    })
  }
    let cant=await CantReq.findOne({email});
    if(!cant){
      return res.status(400).json({
        success:false,
        msg:"Can't find canteen in the request collection."
      })
    }

    if(!cant.isVerified){
      return res.json({
        success:false,
        msg:"This canteen is not verified yet."
      });
    }

    let existingSlug=await Canteen.findOne({slug});
    if(existingSlug){
      return res.json({
        success:false,
        msg:"This slug already exists."
      });
    }

    const newCant=new Canteen({
       clgName:cant.clgName,
       slug,
       location:cant.location,
       phoneNo:cant.phoneNo,
       email
  });
  let owner=undefined;
  //Check if one user exists
  let newUser, existingUser=await User.findOne({email});
  if(existingUser){
   req.flash("error","This email is already in use.");
   return res.json({
    success:false,
    msg:"Mail alreday in use"
   });
  }else{
  newUser=new User({//Register the user first
    username:cant.username,
    email,
    phoneNo:cant.phoneNo,
    role:["admin"],
    isVerified:true,
    canteen:newCant._id
  });
  await newUser.save();
  owner=newUser._id;
 }
 
  newCant.owner=owner;
  await newCant.save();
  try{
  await mailSend(newCant,"approve");
   resMsg="Approved successfully";
   resStatus="success";
  }catch(err){
   await Canteen.deleteOne({email});
    if(existingUser){
      existingUser.role=existingUser.role.filter((val)=>val!=="admin");
      await existingUser.save();
    }else{
      await User.deleteOne({_id:newUser._id});
    }
   
    return res.json({
      success:false,
      msg:"Can't send mail"
    });
  }
  
  
}else if(action==="reject") {
  try{
  await mailSend({email},"reject");
  resMsg="Rejected";
  resStatus="success";
  }catch(err){
    resMsg="Can't send mail";
    resStatus="failed";
  }
  
  }else{
  throw new ExpressError(400,"Incorrect action request");
}
  await CantReq.deleteMany({email});
  if(resStatus==="failed"){
    return res.json({
      success:false,
      msg:resMsg
    });
  }else {
    return res.json({
      success:true,
      msg:resMsg
    });
  }
  
}));

//Toggle action
app.post("/Mensa.app/activeToggle",wrapAsync(async(req,res,next)=>{
   let email=req.body.email;
   if(!email){
    req.flash("error","Email isnt sent.");
    return res.redierct("/superAdmin");
   }
   let cant=await Canteen.findOne({email});
   if(!cant){
    req.flash("error","Canteen doesn't exist.");
    return res.redierct("/superAdmin");
   }
   cant.isActive=!cant.isActive;
   await cant.save();
   let [liveCnt,pausedCnt]=await Promise.all([
    Canteen.countDocuments({isActive:true}),
    Canteen.countDocuments({isActive:false})
   ]);
   return res.json({
    success:true,
    liveCnt,
    pausedCnt
   });
}));

//Password Reset or set
app.get("/Mensa.app/resetPassword/:token",wrapAsync(async(req,res,next)=>{
  let token=req.params.token;
  if(!token){
    throw new ExpressError(404,"Incorrect request.");
  }
  let {hashedToken}=genResetToken(token);
  let user=await User.findOne({resetToken:hashedToken}).populate("canteen","clgName");
  if(!user){
    throw new ExpressError(400,"Your account cannot be found. Please report the issue.");
  }
  if(user.tokenExpiry<Date.now()){
    throw new ExpressError(400,"Your reset token expired. Please reply the mail for another reset link");
  }
  res.render("users/newPasswordForm.ejs",{token,clgName:user.canteen.clgName});
}));

app.post("/Mensa.app/resetPassword/:token",wrapAsync(async(req,res,next)=>{
  
   let token=req.params.token;
   if(!token) throw new ExpressError(404,"Incorrect token or request.");

   let{hashedToken}=genResetToken(token);

   let user=await User.findOne({resetToken:hashedToken});
   if(!user) throw new ExpressError(400,"Can't find your account.");

   if(user.tokenExpiry<Date.now()){
    throw new ExpressError(400,"Your reset token expired. Please reply the mail for another reset link");
  }
     
   if(!user.isVerified){
    throw new ExpressError(400,"Your account is not verified.");
   }

   

   let {newPassword,confirmNewPassword}=req.body;
   if(!newPassword || !confirmNewPassword) throw new ExpressError(400,"Please fill both required fields.");
   if(newPassword!==confirmNewPassword) throw new ExpressError(400,"Both passwords didn't match.");
   if(newPassword.length<6){
    throw new ExpressError(400,"Password must be atleast 6 characters long");
   }
   await user.setPassword(newPassword);
   user.resetToken=undefined;
   user.tokenExpiry=undefined;
   await user.save();
   req.flash("success","Successful.");
   return res.render("msg.ejs",{msg:"Password set successfully."});
}));

//Index route
app.get("/Mensa.app/canteen/:slug",checkCanteen,checkActiveCanteen,wrapAsync(async(req,res,next)=>{
  let slug=req.params.slug;
  if(!slug){
    throw new ExpressError(404,"Incorrect Request");
  }
  let canteen=req.canteen || await Canteen.findOne({slug});
  if(!canteen){
    throw new ExpressError(400,"Your canteen doesn't exist.");
  }
  res.render("index",{slug,clgName:canteen.clgName});
}));




// app.use("/user",userRoute);

// app.use("/menu",menuRoute);

// // Route to add item in cart
// app.use("/cart",cartRoute);

// app.use("/admin",adminRoute);


// app.get("/logout",checkLogin,wrapAsync(async(req,res,next)=>{
//     req.logout((err)=>{
//         if(err) return next(err);
//         req.flash("success","Logged out");
//         res.redirect("/");
//     });
   
// }));

// app.use("/orders",orderRoute);


app.get("/Mensa.app/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Logged out successfully.");
        res.redirect("/Mensa.app");
    });
});

app.use((req, res, next) => {
    next(new ExpressError(404, "The requested page was not found."));
});

app.use((err, req, res, next) => {
    console.error("Express Error:", err);
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Something went wrong";

    // If request is JSON / AJAX, return JSON so frontend displays it in the message box on the same page
    if (req.xhr || (req.headers.accept && req.headers.accept.includes("json")) || (req.headers["content-type"] && req.headers["content-type"].includes("application/json"))) {
        return res.status(statusCode).json({ success: false, msg: message, message });
    }

    // For form actions or non-GET requests, redirect back so error appears in the message box on the same page
    if (req.method !== "GET") {
        req.flash("error", message);
        let referer = req.get("Referrer") || "/Mensa.app";
        return res.redirect(referer);
    }

    // For direct GET errors, render within layout as a message-type box
    res.status(statusCode).render("error.ejs", { message, statusCode, clgName: req.canteen?.clgName || "Mensa", slug: req.params?.slug });
});