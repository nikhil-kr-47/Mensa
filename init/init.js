const data = require("./menu");
const Menu = require("../models/menuItems");
const express = require("express");
const app = express();
const mongoose = require("mongoose");

app.listen(8080, (req, res) => {
    console.log("Listening");
});

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/CampusBites");
}

main().then(() => { console.log("Connected to Db"); }).catch(err => console.log(err));

app.get("/init", async (req, res) => {
    await Menu.insertMany(data);
    res.send("Done");
});
