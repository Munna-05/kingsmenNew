var db = require('../config/connection')
var collection = require('../config/collection');
const { ObjectId, Collection } = require('mongodb');
const async = require('hbs/lib/async');
const bcrypt = require('bcrypt')
const Razorpay = require('razorpay')


var instance = new Razorpay({
    key_id: 'rzp_test_H11APaliOF96Ev',
    key_secret: 'VvnXZtvVjWS8lWuN7Ce45jVJ',
});



module.exports = {
    addUser: (user) => {
        db.get().collection('user_details').insertOne(user).then((user) => {
            console.log(user);

            console.log('user added');

        })
    },
    getUser: () => {
        return new Promise((resolve, reject) => {
            let users = db.get().collection(collection.USER_COLLECTIONS).find().toArray()
            resolve(users)
            console.log('get user successfull');
        })

    },
    blockUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTIONS).updateOne({ _id: ObjectId(id) }, { $set: { blockStatus: "Blocked" } })
            resolve
        })
    },
    unblockUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTIONS).updateOne({ _id: ObjectId(id) }, { $set: { blockStatus: "Active" } })
            resolve
        })
    },
    deleteUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTIONS).deleteOne({ _id: ObjectId(id) })
            resolve
        })
    },
    checkuser: (email) => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.USER_COLLECTIONS).find({ email: email }).toArray()
            resolve(details)
            // console.log(details);
        })
    },
    findUser: (data) => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.USER_COLLECTIONS).findOne({ phone: data })
            console.log("findUser : " + details);
            resolve(details)
        })

    },
    changeProductCount: (details) => {
        console.log(details);

        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {

            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTIONS)
                    .updateOne({ _id: ObjectId(details.cart) },
                        {
                            $pull: { products: { item: ObjectId(details.product) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
            } else {
                db.get().collection(collection.CART_COLLECTIONS)
                    .updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },

                        {
                            $inc: { 'products.$.quantity': details.count }
                        }).then((response) => {
                            resolve({ status: true })
                        })
            }
            // db.get().collection(collection.CART_COLLECTIONS).updateOne({ _id:ObjectId(details.cart), 'products.item':ObjectId(details.product) },
            // {
            //     $inc: { 'products.$.quantity': details.count }
            // }).then((response) => {
            //     resolve({status:true})
            // })



        })
    },
    placeOrder: ((userId, order, products, total) => {
        console.log("asdasdasdasd");
        console.log(order);
        return new Promise(async (resolve, reject) => {
            let status = "placed"

            var deliveryAddress = order
            // await db.get().collection(collection.USER_COLLECTIONS).findOne({ address: order.address })

            // if (deliveryAddress == "" || deliveryAddress==null) {
            //     var deliveryAddress = await db.get().collection(collection.USER_COLLECTIONS).findOne({ address2: order.address })
            //     console.log(("delivery address is none"));
            // }

            console.log("delivery address");
            console.log(deliveryAddress);
            let orderObject = {
                deliveryDetails: deliveryAddress,
                user: userId,
                userEmail: order.email,
                paymentMethod: order.paymentMethod,
                products: products,
                status: status,
                OrderStatus:false,
                amount: total,
                date: new Date().toLocaleDateString(),
                time:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTIONS).insertOne(orderObject).then((response) => {
                db.get().collection(collection.CART_COLLECTIONS).deleteOne({ user: userId })
                resolve(response.insertedId)
            })
        })
    }),


    checkSignup: (name, email) => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.USER_COLLECTIONS).find({ name: name, email: email }).toArray()
            console.log("findUser : " + details);
            resolve(details)
        })

    },
    updateuserprofile: (id, details) => {
        return new Promise(async (resolve, reject) => {
            console.log("222222222222222222");
            console.log(details);
            console.log(id);
            db.get().collection(collection.USER_COLLECTIONS).updateOne({ _id: ObjectId(id) }, {
                $set: {
                    name: details.name, email: details.email,
                    phone: details.phone,
                    address: details.address,
                    address2: details.address2,

                }
            })
                .then(() => {

                    resolve()
                    console.log("user updated");
                })
        })
    },
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTIONS).insertOne(userData).then((data) => {
                resolve(data)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTIONS).findOne({ email: userData.email })
            if (user) {
                if (user.blockStatus == "Active") {
                    bcrypt.compare(userData.password, user.password).then((status) => {
                        if (status) {
                            console.log("login success");
                            response.user = user
                            response.status = true
                            resolve(response)
                        } else {
                            console.log("failed login");
                            resolve({ status: false })
                        }
                    })
                } else {
                    console.log("blocked user");
                    resolve({ status: "Blocked" })
                }
            } else {
                console.log("failed login2");
                resolve({ status: false })
            }
        })
    },
    signUpCheck: (Details) => {
        let response = {}
        // console.log("asdasdasd",Details);
        EmailId = Details.email
        console.log("email Id:", EmailId);
        console.log("entered email" + EmailId);
        return new Promise(async (resolve, reject) => {
            let email = await db.get().collection(collection.USER_COLLECTIONS).findOne({ email: EmailId })
            if (email == "" || email == null) {
                console.log('no same email');
                response.status = false
                resolve(response)
            } else {
                console.log('same email');
                response.status = true
                resolve(response)
            }
        })
    },
    signupPhone: (Details) => {
        let response = {}
        // console.log("asdasdasd",Details);
        phone = Details.phone
        console.log("email Id:", phone);
        console.log("entered email" + phone);
        return new Promise(async (resolve, reject) => {
            let phoneId = await db.get().collection(collection.USER_COLLECTIONS).findOne({ phone: phone })
            if (phoneId == "" || phoneId == null) {
                console.log('no same email');
                response.status = false
                resolve(response)
            } else {
                console.log('same email');
                response.status = true
                resolve(response)
            }
        })
    },
    generateRazorpay: (orderId,totalprice) => {
        return new Promise((resolve, reject) => {
            var options={
                amount: totalprice*100,
                currency: "INR",
                receipt: ""+orderId
            }
            instance.orders.create(options,(err,order)=>{
                console.log("new order : ",order)
                resolve(order)
            })
        })
    },
    updatePassword:(id,newpass)=>{
        return new Promise (async(resolve,reject)=>{
        await db.get().collection(collection.USER_COLLECTIONS).updateOne({_id:ObjectId(id)},{
            $set:{password:newpass}
        }).then(()=>{
            resolve()
            console.log("_________________________passsword updated");
        })
        
        })
        // console.log(userdet);
    
    }
}