const crypto=require("crypto");

function genResetToken(rawToken=""){
    if(rawToken==="") rawToken=crypto.randomBytes(32).toString("hex");
   
    let hashedToken=crypto.createHash("sha256").update(rawToken).digest("hex");
    return {rawToken,hashedToken};
}

module.exports=genResetToken;