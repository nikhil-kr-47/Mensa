const Menu=require("../models/menuItems");
const Canteen=require("../models/canteen");
module.exports.getMenu=async(req,res,next)=>{
  let type=req.params.type;
  if(!type || !["user","admin"].includes(type)) throw new ExpressError(404,"Incorrect request");

  if(type!=="admin") throw new ExpressError(404,"Incorrect request");
  let slug=req.params.slug;
  let canteen=await Canteen.findOne({slug});

  let menu=await Menu.find({canteen:canteen._id});
  return res.render("manageMenu.ejs",{menuItems:menu,slug,type,clgName:canteen.clgName});

}

module.exports.getMenuForm=async(req,res,next)=>{
    let type=req.params.type;
  if(!type || !["user","admin"].includes(type)) throw new ExpressError(404,"Incorrect request");
  if(type!=="admin") throw new ExpressError(404,"Incorrect request");
  let slug=req.params.slug;
  let canteen=await Canteen.findOne({slug});
  return res.render("menu/menuForm",{item:null,slug,type,clgName:canteen.clgName});
}

module.exports.editMenuForm=async(req,res,next)=>{
     let type=req.params.type;
  if(!type || !["user","admin"].includes(type)) throw new ExpressError(404,"Incorrect request");

  let slug=req.params.slug;
  let canteen=await Canteen.findOne({slug});

  let itemId=req.params.itemId;
  if(!itemId) {
    req.flash("error","Incorrect request");
    return res.redirect(`/Mensa.app/canteen/${slug}/menu/admin`);
  }

  let item=await Menu.findById(itemId);
  if(!item){
    req.flash("error","Item not found");
    return res.redirect(`Mensa.app/canteen/${slug}/menu/admin`);
  }
  return res.render("menu/menuForm",{item,slug,type,clgName:canteen.clgName});
}

module.exports.createItem=async(req,res,next)=>{
    let type=req.params.type;
     if(!type || !["user","admin"].includes(type)) throw new ExpressError(404,"Incorrect request");

  let slug=req.params.slug;
  let canteen=await Canteen.findOne({slug});

   const { name, description, price, category, isVeg } = req.body;
   if(!name || !price || !category || !isVeg) throw new ExpressError(400,"Missing required fields.");

   const item=new Menu({
    canteen:canteen._id,
    name,description,price,category,isVeg
   })
   await item.save();
   req.flash("success","Item saved successfully.");
   res.redirect(`/Mensa.app/canteen/${slug}/menu/admin`);
}

module.exports.postEditItem=async(req,res,next)=>{
    let type=req.params.type;
     if(!type || !["user","admin"].includes(type)) throw new ExpressError(404,"Incorrect request");

  let slug=req.params.slug;
//   let canteen=await Canteen.findOne({slug});

  const { name, description, price, category, isVeg } = req.body;
   if(!name || !price || !category || !isVeg) throw new ExpressError(400,"Missing required fields.");

   let itemId=req.params.itemId;
  if(!itemId) {
    req.flash("error","Incorrect request");
    return res.redirect(`/Mensa.app/canteen/${slug}/menu/admin`);
  }

  let item=await Menu.findById(itemId);
  if(!item){
    req.flash("error","Item not found");
    return res.redirect(`/Mensa.app/canteen/${slug}/menu/admin`);
  }

   item.name=name;
   item.description=description;
   item.price=price;
   item.category=category;
   item.isVeg=isVeg;
   await item.save();
   req.flash("success","Item updated successfully.");
   return res.redirect(`/Mensa.app/canteen/${slug}/menu/admin`);
}

module.exports.deleteItem=async(req,res,next)=>{
    let type=req.params.type;
     if(!type || !["user","admin"].includes(type)) throw new ExpressError(404,"Incorrect request");

  let slug=req.params.slug;
  let itemId=req.params.itemId;
  if(!itemId) {
    return res.json({
        success:false,
        msg:"Incorrect request"
    });
  }

  let item=await Menu.findById(itemId);
  if(!item){
     return res.json({
        success:false,
        msg:"Item not found."
    });
  }

  await item.deleteOne({_id:itemId});
  return res.json({
    success:true,
    msg:"Item deleted successfully."
  });
}

module.exports.toggleAvailability=async(req,res,next)=>{
     
    let type=req.params.type;
     if(!type || !["user","admin"].includes(type)) throw new ExpressError(404,"Incorrect request");

  let slug=req.params.slug;
  let itemId=req.params.itemId;
  if(!itemId) {
   
    return res.json({
        success:false,
        msg:"Incorrect request"
    });
   
  }

  let item=await Menu.findById(itemId);
  if(!item){
   
    return res.json({
        success:false,
        msg:"Item not found"
    });
    
  }

   item.isAvailable=!item.isAvailable;
   await item.save();
   return res.json({
    success:true,
    msg:`Item is now ${item.isAvailable ? "available" : "unavailable"}`,
    isAvailable:item.isAvailable
   });
}

