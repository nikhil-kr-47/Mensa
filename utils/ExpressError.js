class ExpressError extends Error{
    constructor(status,msg){
        super(msg);
        this.status=status;
        this.message=msg;
    }
}

module.exports=ExpressError;
