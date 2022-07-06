const routes = require("../routes/users");
const productHelper = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const { Db } = require("mongodb");
var db = require("../config/connection");
var collection = require("../config/collection");

module.exports = {
  getcart: async (req, res) => {
    let user = req.session.user;
    console.log("cart :" + user);
    let cartItems = await productHelper.getcart(req.session.user._id);
    console.log("...........................cart items", cartItems);
    let total = await productHelper.getTotalAmount(req.session.user._id);

    res.render("users/cart", { cartItems, user, total });
  },
  updateProfile: (req, res) => {
    let user = req.session.user;
    res.render("users/updateform", { user });
  },
  orders: async (req, res) => {
    console.log("get request order");
    let user = req.session.user;
    let cartItems = await productHelper.getcart(req.session.user._id);
    let total = await productHelper.getTotalAmount(req.session.user._id);
    console.log("total : " + total);
    req.session.total = total;
    res.render("users/orderPlacing", { user, total ,cartItems});
  },
  updateUserDetails: (req, res) => {
    console.log("1111111111111111111111111");
    console.log(req.session.user._id);
    let userid = req.session.user._id;
    userHelpers.updateuserprofile(userid, req.body);
    res.redirect("/users/user-profile");
  }, 
};
