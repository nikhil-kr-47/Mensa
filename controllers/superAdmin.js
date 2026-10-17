const CantRequests = require("../models/cantRequests");
const Canteen = require("../models/canteen");

module.exports.getSuperAdminAuth = (req, res) => {
    res.render("superAdminAuth.ejs");
};

module.exports.postSuperAdmin = async (req, res) => {
    req.flash("success", "Welcome Super Admin!");
    res.redirect("/Mensa.app/superAdmin/get");
};

module.exports.getSuperAdmin = async (req, res) => {
    let [reqs, cants, liveCnt, pausedCnt] = await Promise.all([
        CantRequests.find({}),
        Canteen.find({}),
        Canteen.countDocuments({ isActive: true }),
        Canteen.countDocuments({ isActive: false })
    ]);
    res.render("users/superAdmin.ejs", {
        reqs,
        cants,
        reqCnt: reqs.length,
        liveCnt,
        pausedCnt
    });
};
