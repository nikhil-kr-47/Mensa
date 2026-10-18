const ExpressError=require("../utils/ExpressError");
const User=require("../models/user");
const Canteen=require("../models/canteen");
const mailSend=require("../utils/handleEmail");
const passport = require("passport");

const maxOtpFreq=3;

 function checkOtpCriteria(user){
  if(user.freqExpireDate.toDateString()!==new Date().toDateString()){
    user.otpFreq=0;
    user.freqExpireDate=new Date();
  }
  return user.otpFreq>=maxOtpFreq;
    
}
 

module.exports.postUserSignup=async(req,res,next)=>{
  let slug=req.params.slug;
  if(!slug) throw new ExpressError(404,"Incorrect request.");
   
  let {username,email,phoneNo,password,confirmPassword}=req.body;
  if(!username || !email || !phoneNo || !password || !confirmPassword) throw new ExpressError(404,"Incorrect request.");

  if(password!=confirmPassword) throw new ExpressError(400,"Password doesn't match.");

  let cant=await Canteen.findOne({slug});
  if(!cant) throw new ExpressError(404,"Your canteen doesn't exist.");

  let existingUser=await User.findOne({email});
  if(existingUser) {
    if(existingUser.isVerified){
      if(existingUser.role.includes("user")){
        req.flash("error","This email is alreday registered.");
        return res.redirect(`/Mensa.app/canteen/${slug}`);
      }else{    
        req.flash("error","This email is already registered as admin. Please log in and add yourself as a user from your admin account.");
        return res.redirect(`/Mensa.app/canteen/${slug}`);
      }
    }else{
      if(checkOtpCriteria(existingUser)){
        req.flash("error","You have reached the limit of otp for today.");
         return res.redirect(`/Mensa.app/canteen/${slug}`);
      }
      existingUser.username=username;
      existingUser.phoneNo=phoneNo;
      await existingUser.setPassword(password);
      await existingUser.save();
      try{
        await mailSend(existingUser);
        }catch(err){
          req.flash("error","Can't send email.");
          return res.redirect(`/Mensa.app/canteen/${slug}`);
      }
      req.session.regEmail=email;
      req.session.regType="user";
      req.session.slug=slug;
      return res.redirect("/Mensa.app/getOtp/user");
    }
  }

  let newUser=new User({
    username,email,phoneNo,
    role:["user"],
    canteen:cant._id
  });
  await User.register(newUser,password);
  try{
  await mailSend(newUser);
  }catch(err){
    req.flash("error","Can't send email.");
    return res.redirect(`/Mensa.app/canteen/${slug}`);
  }
  req.session.regEmail=email;
  req.session.regType="user";
  req.session.slug=slug;
  
  return res.redirect("/Mensa.app/getOtp/user");
}

module.exports.postUserLogin = async(req, res, next) => {
  
  passport.authenticate("local", async(err, user, info) => {
    if (err) return next(err);

    let slug = req.params.slug;
    let type = req.params.type;

    if (!user) {
      req.flash("error", info?.message || "Incorrect username or password.");
      return res.redirect(`/Mensa.app/canteen/${slug}`);
    }

    if(user.isBlocked){
      req.flash("error","Your account has been blocked by your canteen's admin.");
      return res.redirect(`/Mensa.app/canteen/${slug}`);
    }

    if (!user.isVerified) {
          req.flash("error", "Verify your email first through sign in again.");
          return res.redirect(`/Mensa.app/canteen/${slug}`);
    }

    try{

      
        if (!slug) throw new ExpressError(404, "Incorrect request.");

        let canteen = await Canteen.findOne({ slug });
        if (!canteen) throw new ExpressError(404, "Your canteen is not registered.");
        if (user.canteen.toString() !== canteen._id.toString())
          throw new ExpressError(404, "You are on wrong canteen.");

      
        if (!type ) throw new ExpressError(404, "Incorrect request.");
        if (!user.role.includes(type)) {
          req.flash("error", `You are not registered as ${type}.`);
          return res.redirect(`/Mensa.app/canteen/${slug}`);
        }

        
       

        if(!user.isVerified){
          throw new ExpressError(400,"Verify your email and try again.");
        }

    }catch(err){
      next(err);
    }
   
    req.login(user, async (err) => {
      if (err) return next(err);

      try {
        
       if (type === "user" || type === "admin") {
          return res.redirect(
            type === "user"
              ? `/Mensa.app/canteen/${slug}/dashboard/user`
              : `/Mensa.app/canteen/${slug}/dashboard/admin`
          );
        } else {
          throw new ExpressError(404, "Incorrect request type.");
        }
      } catch (err) {
        next(err);
      }
    });
  })(req, res, next);
}

module.exports.userLogout=async(req,res,next)=>{
  let slug=req.params.slug;
  req.logout(err=>{
    if(err) return next(err);
    req.flash("success","Logged out successfully.");
    if(slug) return res.redirect(`/Mensa.app/canteen/${slug}`);
    return res.redirect("/Mensa.app");
  });
}

module.exports.flagUser = async (req, res, next) => {
  let { slug, userId } = req.params;
  let user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, msg: "User not found." });
  }

  user.flagCnt = (user.flagCnt || 0) + 1;
  await user.save();

  return res.json({
    success: true,
    flagCnt: user.flagCnt,
    isBlocked: user.isBlocked,
    msg: `Added flag for ${user.username}. Total flags: ${user.flagCnt}.`
  });
};

module.exports.toggleBlockUser = async (req, res, next) => {
  let { slug, userId } = req.params;
  let user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, msg: "User not found." });
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  return res.json({
    success: true,
    flagCnt: user.flagCnt || 0,
    isBlocked: user.isBlocked,
    msg: user.isBlocked 
      ? `${user.username} has been blocked from placing orders.` 
      : `${user.username} has been unblocked.`
  });
};

