var express = require('express');
const async = require('hbs/lib/async');
const { Admin, ObjectId } = require('mongodb');
const { getCategoryItems } = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var userHelper = require('../helpers/user-helpers')
var db = require('../config/connection')
var collection = require('../config/collection');
const isEligibleRequest = require('express-fileupload/lib/isEligibleRequest');
const store = require('../middleware/multer');
const { Store } = require('express-session');
var db = require('../config/connection')
require('dotenv').config()

let user;
let password=process.env.ADMINPASSWORD

const verifyAdmin = (req, res, next) => {
    if (req.session.adminLogged == true) {
        next()
    } else {
        res.redirect('/admin/admin')
    }
}

router.get('/admin', async (req, res) => {
    if (req.session.adminLogged == true) {
        let users = await db.get().collection(collection.USER_COLLECTIONS).count()
        let products = await db.get().collection(collection.PRODUCT_COLLECTION).count()
        let active = await db.get().collection(collection.USER_COLLECTIONS).find({ blockStatus: "Active" }).count()
        let orderDetails = await db.get().collection(collection.ORDER_COLLECTIONS).count()
        let watchCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "watches" }).count()
        let shoesCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "shoes" }).count()
        let eyewearCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "eyewear" }).count()
        let perfumeCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "perfumes" }).count()
        let suitsCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "Suits" }).count()
        console.log("______________________________users");
        console.log(users);
        console.log("______________________________products");
        console.log(products);
        res.render('admin/adminHome', { admin: true, users, products, orderDetails, active, watchCount, shoesCount, eyewearCount, perfumeCount, suitsCount })
    } else if (req.session.adminError) {
        let error = req.session.adminError
        res.render('admin/adminLogin', { error })
    } else {
        res.render('admin/adminLogin')
    }
})
router.post('/admin', async (req, res) => {
    console.log(req.body);
    if (req.body.user == "admin" && req.body.password == password) {
        req.session.adminLogged = true
        let users = await db.get().collection(collection.USER_COLLECTIONS).count()
        let products = await db.get().collection(collection.PRODUCT_COLLECTION).count()
        let active = await db.get().collection(collection.USER_COLLECTIONS).find({ blockStatus: "Active" }).count()
        let orderDetails = await db.get().collection(collection.ORDER_COLLECTIONS).count()
        let watchCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "watches" }).count()
        let shoesCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "shoes" }).count()
        let eyewearCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "eyewear" }).count()
        let perfumeCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "perfumes" }).count()
        let suitsCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "Suits" }).count()

        console.log("______________________________users");
        console.log(users);
        console.log("______________________________products");
        console.log(products);
        res.render('admin/adminHome', { admin: true, users, products, orderDetails, active, watchCount, shoesCount, eyewearCount, perfumeCount, suitsCount })
    } else {
        req.session.adminError = "Username and Password Does't Match"
        res.redirect('/admin/admin')
    }
})
router.get('/adminHome', async (req, res) => {
    if (req.session.adminLogged == true) {
        let users = await db.get().collection(collection.USER_COLLECTIONS).count()
        let products = await db.get().collection(collection.PRODUCT_COLLECTION).count()
        let active = await db.get().collection(collection.USER_COLLECTIONS).find({ blockStatus: "Active" }).count()
        let orderDetails = await db.get().collection(collection.ORDER_COLLECTIONS).count()
        let watchCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "watches" }).count()
        let shoesCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "shoes" }).count()
        let eyewearCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "eyewear" }).count()
        let perfumeCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "perfumes" }).count()
        let suitsCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: "Suits" }).count()
        console.log("______________________________users");
        console.log(users);
        console.log("______________________________products");
        console.log(products);
        res.render('admin/adminHome', { admin: true, users, products, orderDetails, active, watchCount, shoesCount, eyewearCount, perfumeCount, suitsCount })
    } else {
        res.redirect('/admin/admin')
    }
})
router.get('/userDetails', verifyAdmin, async (req, res) => {
    let users = await userHelper.getUser()
    console.log(user);
    res.render('admin/userDetails', { users, admin: true })
})
router.get('/block/:id', (req, res) => {
    let id = req.params.id
    console.log(id);
    userHelper.blockUser(id)
    res.redirect('/admin/userDetails')
})
router.get('/unblock/:id', verifyAdmin, (req, res) => {
    let id = req.params.id
    console.log(id);
    userHelper.unblockUser(id)
    res.redirect('/admin/userDetails')
})
router.get('/delete/:id', verifyAdmin, (req, res) => {
    let id = req.params.id
    console.log(id);
    userHelper.deleteUser(id)
    res.redirect('/admin/userDetails')
})
//..................................................................product section
router.get('/products', verifyAdmin, (req, res) => {
    res.render('admin/admin_viewProducts', { admin: true })
})
//...............................................................viewing Products
router.get('/product_list/:category', async (req, res) => {
    const category = req.params.category
    let item = await productHelper.getCategoryItems(category)
    console.log(item);
    res.render('admin/adminProducts', { item, admin: true })
})
router.get('/add_product', verifyAdmin, (req, res) => {
    res.render('admin/add_product', { admin: true })
})
const addproduct = (req, res) => {
    
    // console.log(req.body);
    console.log(req.files);
    console.log(req.files.image)
    let image = req.files.image
    productHelper.addProduct(req.body, ((id) => {
        console.log(id);
        // image.mv('./public/product-images/' + result + '.jpg')
        const files = req.files
        console.log(files);
        if (!files) {
            const error = new Error('please choose images')
            return next(error)
        }
        let result = files.map(async (src, index) => {
            let productImage = {
                filename: files[index].filename
            }
            productHelper.pushImages(id, productImage)
        })
        Promise.all(result).then((msg) => {

            res.redirect('/admin/products')
        })
    }))
}
router.post('/add_product', store.array('image', 4), addproduct)

router.get('/deleteProduct/:id', (req, res) => {
    let id = req.params.id
    console.log(id);
    productHelper.deleteProduct(id)
    res.render('admin/admin_viewProducts', { admin: true })
})
router.get('/orderbook', async (req, res) => {
    let orderDetails = await db.get().collection(collection.ORDER_COLLECTIONS).find().sort({ date: -1 }).toArray()
    console.log(orderDetails);
    res.render('admin/admin_orderbook', { orderDetails, admin: true })
})
router.get('/cancelorder/:id', async (req, res) => {
    let id = req.params.id
    await productHelper.cancelOrder(id)
    // let orderDetails=req.session.orderDetails
    // let user=req.session.user
    res.redirect('/admin/orderbook')
})
router.get('/logout', verifyAdmin, (req, res) => {
    req.session.adminLogged = false
    req.session.destroy()
    console.log('admin session cleared');
    res.redirect('/admin/admin')
})
router.get('/editproduct/:id', async (req, res) => {
    let id = req.params.id
    console.log(id)
    await productHelper.getProduct(id).then((products) => {
        console.log("..........................");
        console.log(products);
        res.render('admin/edit-product', { products, admin: true })
        console.log("product id", ObjectId(products._id));
        console.log(products);
    })
})
router.post('/edit-product/:id', (req, res) => {
    console.log("000000000000000000000");
    console.log(req.body);
    let id = req.params.id
    console.log(id);
    productHelper.updateProduct(id, req.body)
})
router.post('/statusupdate/:id', (req, res) => {
    console.log(req.params.id);
    // res.send(req.params.id)
    let id = req.params.id
    productHelper.orderStatusUpdate(id, req.body)
})
router.get('/addCoupon', verifyAdmin, (req, res) => {
    if (req.session.msg) {
        let msg = req.session.msg
        res.render('admin/coupon', { admin: true, msg })
    } else {
        res.render('admin/coupon', { admin: true })
    }
})
router.post('/addCoupon', verifyAdmin, async (req, res) => {
    console.log(req.body);
    await productHelper.addCoupon(req.body)
    req.session.msg = "coupon added successfully"
    res.redirect("/admin/addCoupon")
})
module.exports = router;