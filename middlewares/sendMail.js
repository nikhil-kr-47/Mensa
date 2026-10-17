const nodemailer = require("nodemailer");
const genResetToken=require("../utils/genResetToken");
const User=require("../models/user");
const ExpressError=require("../utils/ExpressError");

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY
    }
});

async function handleResetToken(email){
    let user=await User.findOne({email});
    if(!user){
        throw new ExpressError(400,"User not found.");
    }
    let {rawToken,hashedToken}=genResetToken();
    user.resetToken=hashedToken;
    user.tokenExpiry=Date.now()+1000*60*60*24;
    await user.save();
    return rawToken;
}
  
   async function sendMail(doc,msg){
    if(msg==="approve"){
       
       let token= await handleResetToken(doc.email);
        await transporter.sendMail({
            from: `"Mensa" <${process.env.BREVO_SENDER_EMAIL}>`,
            to: doc.email,
            subject: "Your Mensa Canteen Request",
            html: `<p>Your request for registering canteen is <strong>approved.</strong><br>Thanks for joining us.</p><br>
             Please reset a password for your account with email : ${doc.email} using link : <a href="${process.env.LOCAL_URL}/Mensa.app/resetPassword/${token}">Click here.</a>(Do it within 24 hours or ask for link again through mail)<br><br> <br>The URL for your canteen is : <strong>${process.env.LOCAL_URL}/Mensa.app/canteen/${doc.slug}</strong><br><br>Regards,<br>Mensa.`
        });
    }else if(msg==="reject"){
        await transporter.sendMail({
            from: `"Mensa" <${process.env.BREVO_SENDER_EMAIL}>`,
            to: doc.email,
            subject: "Your Mensa Canteen request",
            html: `<p>Your request for registering canteen is <strong>rejected.</strong><br>Thankyou.<br>Regards,<br>Mensa.</p>`
        });
    }else{
    await transporter.sendMail({
      from: `"Mensa" <${process.env.BREVO_SENDER_EMAIL}>`,
      to: doc.email,
      subject: "Your Mensa verification Code",
      html: `<p>Your verification code is <strong>${msg}</strong>.<br>Thanks for joining us.<br>Regards,<br>Mensa.</p>`
  });
}
  }

  module.exports=sendMail;