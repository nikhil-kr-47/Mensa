const mongoose=require('mongoose');
const passportLocalMongoose=require("passport-local-mongoose").default;
const userSchema=mongoose.Schema({
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
        required:true,
       
    },
    role:[{
        type:String,
        enum:["admin","user","superAdmin"],
    }],
        
   
    resetToken:{
        type:String
    },
    tokenExpiry:{
        type:Date
    },
    otp:{
        type:String
    },
    otpExpiry:{
        type:Date
    },
    otpUpdatedAt:{
        type:Date
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    otpFreq:{
        type:Number,
        default:0
    },
    freqExpireDate:{
        type:Date,
        default:Date.now
    },
    canteen:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Canteen",
        required:function(){
            return !this.role.includes("superAdmin");
        }
    }
});
userSchema.plugin(passportLocalMongoose,{usernameField:"email"});
const User=mongoose.model("User",userSchema);
module.exports=User;