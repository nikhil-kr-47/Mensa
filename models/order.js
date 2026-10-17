
const mongoose=require("mongoose");

const orderSchema=new mongoose.Schema({
    canteen:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Canteen",
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[
        {
            name:{
                type:String,
                required:true
            },
            price:{
                type:Number,
                required:true
            },
            quantity:{
                type:Number,
                required:true
            }
        }
    ],
    total:{
        type:Number,
        required:true
    },
    orderType:{
        type:String,
        enum:["hostel","queue","slot"],
        required:true
    },
    status:{
        type:String,
        enum:["preparing","ready","delivered"],
        default:"preparing"
    },
    tokenNo:Number,
    slotTime:String,
    roomNo:String
},{timestamps:true});

const Order=mongoose.model("Order",orderSchema);
module.exports=Order;