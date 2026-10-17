const mongoose=require("mongoose");

const canteenSchema= new mongoose.Schema({
    clgName:{
        type:String,
        required:true
    },
    slug:{
      type:String,
      required:true,
      unique:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    location:{
        type:String,
    },
    isActive:{
        type:Boolean,
        default:true
    },
    phoneNo:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true
    }
    
},{timestamps:true}); //second argument gives createdAt when a document is created and updatedAt when it is updated

const Canteen=mongoose.model("Canteen",canteenSchema);
module.exports=Canteen;