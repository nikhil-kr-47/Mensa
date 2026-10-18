const joi = require("joi");

const userSchema = joi.object({
    username: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required().min(6),
    confirmPassword: joi.string().required(),
    phoneNo: joi.string().pattern(/^[6-9]\d{9}$/).required()
});

const menuSchema = joi.object({
    name: joi.string().required(),
    price: joi.number().required().min(1),
    image: joi.object({
        url: joi.string().required(),
        public_id: joi.string().required()
    }).required()
});

const orderSchema = joi.object({
    items: joi.array().items(joi.object({
        name: joi.string().required(),
        price: joi.number().required(),
        quantity: joi.number().required().min(1),
        deliveryMode: joi.string().required(),
        ordertype: joi.string().required(),
        orderNumber: joi.number().required()
    })).min(1).required()
});

const cantReqSchema = joi.object({
    username: joi.string().required(),
    email: joi.string().email().required(),
    clgName: joi.string().required(),
    location: joi.string().required(),
    phoneNo: joi.string().pattern(/^[6-9]\d{9}$/).required()
});

module.exports = { userSchema, menuSchema, orderSchema, cantReqSchema };
