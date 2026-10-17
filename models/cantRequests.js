
const mongoose=require("mongoose");

const reqSchema=new mongoose.Schema({
   
    clgName:{
        type:String,
    },
    location:{
        type:String,
    },
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    phoneNo:{
        type:String,
        required:true
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    otp:{
        type:String
    },
    otpExpiry:{
        type:Date
    },
   otpFreq:{
    type:Number,
    default:0
   },
   otpFailedAttempts:{
    type:Number,
    default:0
   },
   failedAttemptsExpireDate:{
    type:Date,
    default:Date.now
   },
   otpUpdatedAt:{
    type:Date
   },
   freqExpireDate:{
    type:Date,
    default:Date.now
   },
   slug:{
    type:String
   }
},{timestamps:true}) ;

const CantReq=mongoose.model("CantReq",reqSchema);
module.exports=CantReq;