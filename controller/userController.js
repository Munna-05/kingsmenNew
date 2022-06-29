const routes = require('../routes/users')
const productHelper = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const { Db } = require('mongodb')
var db = require('../config/connection')
var collection = require('../config/collection');



module.exports = {
    // orders: (req, res) => {
    //     let user = req.session.user
    //     res.send('orders Page')

    // // addtocart: async (req, res) => {
    // //     let id = req.params.id
    // //     let user = req.session.user
    // //     let details = await productHelper.getProduct(id)
    // //     console.log("product details :" + details);
    // //     console.log("......................");
    // //     productHelper.addtocart(details)
    // //     res.render('users/cart', { user })

    //     // console.log(req.body);

    // },
    getcart: async (req, res) => {
        let user = req.session.user
        console.log('cart :' + user);
        let cartItems = await productHelper.getcart(req.session.user._id)
        console.log("...........................cart items", cartItems);
        let total = await productHelper.getTotalAmount(req.session.user._id)
        // let totalDiscount = await productHelper.getDiscount(req.session.user._id)

        // console.log("------------------",cartItems[0].product.ProductOffer);
        
        res.render('users/cart', { cartItems, user, total })
    },
    updateProfile: (req, res) => {
        let user = req.session.user
        res.render('users/updateform', { user })
    },
    orders: async (req, res) => {
        console.log("request order");
        let user = req.session.user
        let total = await productHelper.getTotalAmount(req.session.user._id)
        console.log('total : ' + total);
        req.session.total = total
        res.render('users/orderPlacing', { user, total })
    },
    updateUserDetails: (req, res) => {
        console.log("1111111111111111111111111");
        console.log(req.session.user._id);
        let userid = req.session.user._id
        userHelpers.updateuserprofile(userid, req.body)
        res.redirect("/users/user-profile")

    },

}