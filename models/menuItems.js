const mongoose=require('mongoose');

const menuSchema=new mongoose .Schema({
    canteen:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Canteen",
        required:true
    },
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    price:{
        type:Number,
        required:true,
        min:1
    },
    category:{
        type:String,
        enum:["snacks","meals","beverages","others","south indian", "desserts"]
    },
    isAvailable:{
        type:Boolean,
        default:true
    },
    isVeg:{
        type:Boolean,
        required:true,
    }
});

const MenuItem=mongoose.model("MenuItem",menuSchema);
module.exports=MenuItem;