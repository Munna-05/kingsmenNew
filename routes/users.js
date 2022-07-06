var express = require("express");
var router = express.Router();
var userController = require("../controller/userController");
const productHelpers = require("../helpers/product-helpers");
const { ObjectId, Db } = require("mongodb");
const req = require("express/lib/request");
const handlebars = require("handlebars");
const async = require("hbs/lib/async");
const userHelpers = require("../helpers/user-helpers");
const collection = require("../config/collection");
var db = require("../config/connection");
const bcrypt = require("bcrypt");
var paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AeCcPJjFlQVn6PxXdat0I1xT3KokM9arU0-u_RnGCNJzJBLfknaW5yGXEFWI0nZMtYJmJ6W3BPgpgSCw",
  client_secret:
    "EO4uxMoFVqgfiRgxmtUYa4u0P9M5ORHt03JTHaVy8YTvYJ8iLGKhqgEQ8FWa0nO4kV3oTsWGb5_IbhJe",
});

const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.get("/user-profile", verifyLogin, async (req, res) => {
  // console.log(detail);
  // console.log(userdetails);
  let user = req.session.user;
  console.log(user);
  res.render("users/profile", { user });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  console.log("session cleared");
  res.render("index");
});

router.get("/addtocart/:id", verifyLogin, async (req, res) => {
  let userD = req.session.user._id;
  console.log(userD);
  let user = req.session.user;
  let id = req.params.id;
  console.log(userD);
  console.log("params:" + id);
  productHelpers.addtoCart(id, userD).then(() => {
    console.log("added to cart successfully");
  });

  let cartdetails = await productHelpers.getcart(userD);
  console.log("cartdetails = " + cartdetails);
});

router.get("/updateProfile", verifyLogin, userController.updateProfile);

router.post("/change-product-quantity", (req, res, next) => {
  // console.log('user route');

  userHelpers.changeProductCount(req.body).then(async (response) => {
    console.log("................................");
    response.total = await productHelpers.getTotalAmount(req.session.user._id);

    res.json(response);
  });
});

router.get("/deleteProduct/:id", verifyLogin, async (req, res) => {
  let id = req.params.id;
  let userId = req.session.user._id;
  console.log(id);
  console.log("userid: " + userId);
  await productHelpers.deleteCartProduct(userId, id);
  res.redirect("/users/cart");
});

router.post("/updateProfile", verifyLogin, (req, res) => {
  let details = req.body;
  console.log(details);
  res.send(details);
});

//...........................................................................orders

// router.get('/orders', userController.orders)

router.get("/order", verifyLogin, userController.orders);

router.post("/order",async(req, res) => {
  // res.send("hello")
  console.log("_____________________reqdatas", req.body);

  if (req.body.CouponCode) {
    let coupon = await productHelpers.couponDetails(req.body.CouponCode);
    console.log(coupon);
    let discount = req.session.total - req.session.total * (coupon.Offer / 100);
    console.log("...................... discounted rate", discount);
    req.session.total = discount;
  }

  console.log(req.body);
  let userId = req.session.user._id;
  let products = await productHelpers.getCartProductList(userId);
  console.log("1111111111111111111111111111111111");
  console.log(products);

  if (req.body["paymentMethod"] === "COD") {
    userHelpers
      .placeOrder(userId, req.body, products, req.session.total)
      .then((orderId) => {
        // let user = req.session.user
        req.session.orderId = orderId;
        res.json({ CODsuccess: true });
      });
    //  res.redirect('/users/orderBook')
  } else if (req.body["paymentMethod"] === "razorpay") {
    //razorpay execution
    console.log("..............................total");
    console.log(req.session.total);
    userHelpers.placeOrder(userId, req.body, products, req.session.total);
    userHelpers
      .generateRazorpay(req.session.orderId, req.session.total)
      .then((response) => {
        console.log("..................................response");
        console.log(response);
        res.json({ response });
      });
  } else {
    console.log("paypal"); //paypal execution
    userHelpers.placeOrder(userId, req.body, products, req.session.total);
    var create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "https://vajraindia.in/users/ordersuccess",
        cancel_url: "https://vajraindia.in/",
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: "item",
                sku: "item",
                price: "1.00",
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: "1.00",
          },
          description: "This is the payment description.",
        },
      ],
    };
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {
        console.log("Create Payment Response");
        console.log(payment);
        for (var i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            let link = payment.links[i].href;
            link = link.toString();
            res.json({ paypal: true, url: link });
          }
        }
      }
    });
  }
});
router.get("/bill",verifyLogin,async(req,res)=>{
  let user = req.session.user;
  let cartItems = await productHelpers.getcart(req.session.user._id)
  console.log("cart items...............................",cartItems);
  let total = await productHelpers.getTotalAmount(req.session.user._id);
  let d=new Date()
  let date=[ d.getDate(),d.getMonth(),d.getFullYear()]
  
  res.render('users/bill',{user,cartItems,total,date})
})

router.get("/success", (req, res) => {
  console.log("_________________________-success");
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: "10.00",
        },
      },
    ],
  };
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        console.log(JSON.stringify(payment));
        res.render("users/orderSuccess");
      }
    }
  );
});

router.get("/cart", verifyLogin, userController.getcart);

router.get("/orderbook", verifyLogin, async (req, res) => {
  let userId = req.session.user._id;
  let user = req.session.user;
  let orderDetails = await db
    .get()
    .collection(collection.ORDER_COLLECTIONS)
    .find({ user: userId })
    .sort({ time: -1 })
    .toArray();
  req.session.orderDetails = orderDetails;
  console.log("order details.............................: " + orderDetails);
  res.render("users/orderBook", { orderDetails, user });
});

router.get("/cancelorder/:id", verifyLogin, async (req, res) => {
  let id = req.params.id;
  console.log("_____________________________________cancel order", id);
  await productHelpers.cancelOrder(id);

  res.redirect("/users/orderbook");
});

router.post("/updateuserprofile",
  verifyLogin,
  userController.updateUserDetails
); 

router.get("/buy/:proid", verifyLogin, async (req, res) => {
  let id = req.params.proid;
  let product = await productHelpers.getProduct(id);
  console.log("_________________________________", ObjectId(id));
  console.log(product);
});

router.get("/getOrderProducts/:proid", verifyLogin, async (req, res) => {
  let proid = req.params.proid;
  let id = req.session.user._id;
  let user = req.session.user;
  console.log("________________________");
  console.log(id);
  console.log("________________________");
  console.log(proid);
  let details = await productHelpers.getorderProducts(proid);
  console.log(details);
  res.render("users/orderDisplay", { details, user });
});

router.get("/addtocartbuy/:id", verifyLogin, async (req, res) => {
  let userD = req.session.user._id;
  console.log(userD);
  let user = req.session.user;
  let id = req.params.id;
  console.log(userD);
  console.log("params:" + id);
  productHelpers.addtoCart(id, userD).then(() => {
    console.log("added to cart successfully");
  });

  let cartdetails = await productHelpers.getcart(userD);
  console.log("cartdetails = " + cartdetails);
  res.redirect("/users/cart");
});

router.post("/users/verifypayment", (req, res) => {
  console.log(req.body);
});

router.get("/ordersuccess", verifyLogin, (req, res) => {
  let user = req.session.user;
  res.render("users/orderSuccess", { user });
});

router.get("/changepassword", verifyLogin, (req, res) => {
  let user = req.session.user;
  res.render("users/changePassword", { user });
}); 

router.post("/changepassword", verifyLogin, async (req, res) => {
  let newpass = await bcrypt.hash(req.body.password, 10);
  console.log(">>>>>>>>>>", newpass);
  let userid = req.session.user._id;
  console.log(userid);
  await userHelpers.updatePassword(userid, newpass);
  res.redirect("/users/user-profile");
});
router.get("/wishlist/:id", verifyLogin, (req, res) => {
  let userD = req.session.user._id;
  console.log(userD);
  let user = req.session.user;
  let id = req.params.id;
  console.log(userD);
  console.log("params:" + id);
  productHelpers.addtoWishlist(id, userD).then(() => {
    console.log("added to wishlist");
  });
});
router.get("/wishlist", verifyLogin, async (req, res) => {
  let user = req.session.user;
  console.log("cart :" + user);
  let details = await productHelpers.getwishlist(req.session.user._id);
  console.log(details);
  res.render("users/wishlistDisplay", { details, user });
});

//paypal.........................................................

module.exports = router;
