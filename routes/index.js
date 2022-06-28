var express = require('express');
const collection = require('../config/collection');
var router = express.Router();
var userHelper = require('../helpers/user-helpers')
const mongoClient = require('mongodb').MongoClient
var db = require('../config/connection');
const { MongoClient } = require('mongodb');
const { getAllProducts } = require('../helpers/product-helpers');
var productHelper = require('../helpers/product-helpers');
const { otp } = require('../controller/indexController');
const async = require('hbs/lib/async');
const bcrypt = require('bcrypt')
require('dotenv').config()

 // const serviceSID = 'VA73dedc3c41bc065479d0fef5b9be613d'
// const accountSID = 'AC3951303d100e6997af85a1b05845f244'
// const authToken = '065e90bf9cbd1ef3f6dad9a9f0c63ee3'


const serviceSID = process.env.SERVICESID
const accountSID = process.env.ACCOUNTSID
const authToken = process.env.AUTH

const client = require('twilio')(accountSID, authToken)



/* GET home page. */
router.get('/', function (req, res, next) {
  let user = req.session.user
  console.log(".....................................index user");
  console.log(user);
  if (user || req.session.userLogged == true) {
    res.render('index', { user })
  } else {
    res.render('index', { title: 'Kingsmen' });
  }
});
//.......................................product pages
router.get('/user_view/:category', async (req, res) => {
  const category = req.params.category
  let user = req.session.user
  if (user) {
    let item = await productHelper.getCategoryItems(category)
    res.render('users/user_view_products', { item, user })
  } else {
    let item = await productHelper.getCategoryItems(category)
   
    console.log("........................................");
    console.log(item);
    //  item=[item,...item]
    res.render('users/user_view_products', { item })
  }
})
//............................................login and signups
router.get('/login', (req, res) => {
  let user = req.session.user
  if (user) {
    res.redirect('/')
  } else {
    let error = req.session.loginError
    res.render('users/login', { error })
    req.session.loginError = null
  }
})
router.post('/login', async (req, res) => {
  const email = req.body.email
  const password = req.body.password
  console.log(password);
  let user = await userHelper.checkuser(email)
  console.log(req.body);
  console.log(user);
  console.log(user.blockStatus);
  userHelper.doLogin(req.body).then((response) => {
    if (response.status && response.status != "Blocked") {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else if (response.status == "Blocked") {
      req.session.loginError = "User Blocked"
      console.log(".............blocked");
      res.redirect('/login')
    } else {
      req.session.loginError = "Invalid Username or Password"
      res.redirect('/login')
    }
  })
})

router.get('/signup', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('users/signup')

  }
})
router.post('/signup', (req, res) => {

  //   console.log("reqbody  :  ", req.body);
  //   req.body.password=await bcrypt.hash(req.body.password,10)
  //   let details = await userHelper.checkSignup(req.body.name, req.body.email)
  //   console.log(details);

  //   if (details == "" || details == null) {
  //     userHelper.addUser(req.body)
  //   }
  //   else {
  //     res.render('users/signup', { message: "User Already Exist" })


  //   }

  //   let userdetails = await userHelper.checkuser(req.body.email)

  //   req.session.user = userdetails
  //   req.session.loggedIn=true
  //   console.log("........................................");

  //   let user=req.session.user
  //   console.log("asasdasdadasd",user);

  // res.render('index',{user})
  userHelper.doSignup(req.body).then((response) => {
    console.log("....................");
    console.log(response);
    req.session.loggedIn = true
    req.session.user = req.body
    res.redirect('/')
  }) 
})
//.....................................................otp....

router.get('/otplogin', (req, res) => {
  if (req.session.userLogged == true) {
    let user = req.session.user
    res.render('index', { user })
  } else {
    res.render('users/otplogin')
  }
})


router.post('/otplogin', async (req, res) => {

  var num = req.body.phone
  console.log("phone number : " + num);
  // if(req.session.userLogged){
  //   let user=req.session.user
  //   res.render('index',{user})
  //   // res.send('asdsd')
  // }
  let userDetails = await userHelper.findUser(num)
  console.log(userDetails)

  if (userDetails == "" || userDetails == null) {
    res.render('users/otplogin', { error: "User doesn't exist , Please Sign Up " })
  }
  else {
    client.verify.services(serviceSID).verifications.create({
      to: `+91${req.body.phone}`,
      channel: 'sms'
    })
    req.session.user = userDetails
    req.session.number = req.body.phone
    res.redirect('/otpDone')
  }
})

router.get('/otpDone', (req, res) => {
  if (req.session.userLogged == true) {
    res.redirect('/')
  } else {
    let err = req.session.otperror
    res.render('users/otp', { err })
    req.session.otperror = null
  }
})
router.post('/otpDone', (req, res) => {
  if (req.session.userLogged == true) {
    res.redirect('/')
  } else {
    const otp = req.body.otp
    console.log(otp);
    client.verify.services(serviceSID).verificationChecks.create({
      to: `+91${req.session.number}`,
      code: otp
    }).then(resp => {
      console.log("otp res", resp);
      console.log(resp.valid);
      if (!resp.valid) {
        req.session.otperror = "Invalid Otp"
        res.redirect('/otpDone')
      } else {
        req.session.userLogged = true
        res.redirect('/')
      }
    })
  }
})
//..............................................product

router.get('/product-details/:id', async (req, res) => {
  let id = req.params.id
  let productDet = await productHelper.getProduct(id)
  let user = req.session.user
  console.log(user);
  console.log((productDet));
  res.render('users/productDetailsPage', { productDet, user })
})

// check email

// router.post('/check-email', (req, res, next) => {
//   console.log(req.body);
//   userHelper.signUpCheck(req.body).then((response) => {
//     console.log(response);
//     res.json(response);
//   })
// })


// router.post('/check-phone', (req, res, next) => {
//   console.log(req.body);
//   userHelper.signupPhone(req.body).then((response) => {
//     console.log(response);
//     res.json(response);
//   })
// })

router.get('/success', (req, res) => {
  console.log("_________________________-success");
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

 
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": "10.00"
      }
    }]
  }
  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      console.log(JSON.stringify(payment));
      res.render('users/orderSuccess');
    }
  });
});

module.exports = router;
