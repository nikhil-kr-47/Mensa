const crypto=require("crypto");

function genSlug(clgName){
    let random=crypto.randomBytes(5).toString("hex");
    let slug=clgName+"-"+random;
    return slug;
}

function genUrl(clgName){
   let newClgName=clgName.replace(/[^a-zA-Z0-9]+/g,"-").toLowerCase();
    let slug=genSlug(newClgName);
    
    return slug;
}

module.exports=genUrl;
