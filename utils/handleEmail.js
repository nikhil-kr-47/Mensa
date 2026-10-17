
const sendMail=require("../middlewares/sendMail");
const ExpressError=require("./ExpressError");
const crypto=require("crypto");

function generateOtp(){
    let otp=crypto.randomInt(100000,999999);
    return otp;
}

async function mailSend(doc,msg=""){
    if(msg===""){
        let randOtp=generateOtp();
    let hashedRandOtp=crypto.createHmac("sha256",process.env.OTP_SECRET).update(randOtp.toString()).digest("hex");
    doc.otp=hashedRandOtp;
    doc.otpExpiry=Date.now() + 5*60*1000;
    doc.otpUpdatedAt=Date.now();
    doc.otpFreq=doc.otpFreq+1;
    await doc.save();
    await sendMail(doc,randOtp);
   }else if(msg==="approve"){
        await sendMail(doc,"approve");
    }else if(msg==="reject"){
        await sendMail(doc,"reject");
    }else{
       throw new ExpressError(404,"Incorrect request");
    }
}



module.exports=mailSend;