var db = require('../config/connection')
var collection = require('../config/collection');
const { ObjectId } = require('mongodb');
const async = require('hbs/lib/async');


module.exports = {
    addProduct: (product, callback) => {
        db.get().collection('product').insertOne(product).then((data) => {
            console.log(data);
            callback(data.insertedId)
            console.log('product added');

        })


    },
    getAllProducts: () => {
        return new Promise((resolve, reject) => {
            let products = db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)

        })
    },
    getCategoryItems: (param) => {
        return new Promise((resolve, reject) => {
            let items = db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: param }).toArray()
            resolve(items)
        })
    },
    deleteProduct: (id) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: ObjectId(id) })
            resolve
        })
    },
    getProduct: (id) => {
        return new Promise(async (resolve, reject) => {
            let productDet = await db.get().collection(collection.PRODUCT_COLLECTION).find({ _id: ObjectId(id) }).toArray()
            console.log("---------------------------------------", productDet);
            resolve(productDet)
        })

    },
    addtoCart: (id, user) => {
        let productObj = {
            item: ObjectId(id),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTIONS).findOne({ user: user })

            if (userCart) {
                let proIndex = userCart.products.findIndex(product => product.item == id)

                console.log(userCart);
                console.log("product id : " + id);
                console.log(proIndex);
                if (proIndex != -1) {

                    db.get().collection(collection.CART_COLLECTIONS).updateOne({ user: user, 'products.item': ObjectId(id) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })

                } else {
                    db.get().collection(collection.CART_COLLECTIONS).updateOne({ user: user },
                        {

                            $push: { products: productObj }

                        }).then((response) => {
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: user,
                    products: [productObj]
                }
                db.get().collection(collection.CART_COLLECTIONS).insertOne(cartObj).then((result) => {
                    console.log('added to cart');
                    resolve(result)
                })

            }
        })
    },
    getcart: ((userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTIONS)
                .aggregate([
                    {
                        $match: { user: userId }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    }, {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    }
                ]).toArray()

            resolve(cartItems)
        })

    }),
    deleteCartProduct: (userId, id) => {
        console.log('delete');
        db.get().collection(collection.CART_COLLECTIONS).updateOne({ user: userId },
            {
                $pull: ({ products: { item: ObjectId(id) } })

            })
    },
    getTotalAmount: (userid) => {
        return new Promise(async (resolve, reject) => {
            let pro = await db.get().collection(collection.CART_COLLECTIONS).find({ user: userid }).toArray()
            console.log("................... " + pro);
            let total = await db.get().collection(collection.CART_COLLECTIONS)
                .aggregate([
                    {
                        $match: { user: userid }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    }, {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    },

                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.productPrice' }] } }
                        }


                    }
                ]).toArray()

            console.log("___________________________");
            console.log("___________________________");
            resolve(total[0].total)
        })

    },
    getCartProductList: ((userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTIONS).findOne({ user: userId })
            resolve(cart.products)
        })
    }),
    cancelOrder: (id) => {
        return new Promise((resolve, reject) => {
            console.log("_________",id);
            db.get().collection(collection.ORDER_COLLECTIONS).updateOne({ _id: ObjectId(id) }, { $set: { OrderStatus: true } })
            resolve()
        })

    },
    updateProduct: (id, data) => {
        return new Promise(async (resolve, reject) => {
            console.log(ObjectId(id));
            console.log(data);
            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(id) },
                {
                    $set: {
                        productName: data.productName,
                        productDescription: data.productDescription,
                        productCategory: data.productCategory,
                        productPrice: data.productPrice

                    }
                })

            console.log("product updated");
            resolve

        })
    },
    orderStatusUpdate: (id, data) => {
        return new Promise(async (resolve, reject) => {
            console.log("........................");
            console.log(ObjectId(id));
            console.log(data.status);
            await db.get().collection(collection.ORDER_COLLECTIONS).updateOne({ _id: ObjectId(id) },
                {
                    $set: {
                        status: data.status
                    }
                })
            console.log("updated");
            resolve
        })
    },
    addtoOrderDetails: (id, user) => {
        let productObj = {
            item: ObjectId(id),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTIONS).findOne({ user: user })

            if (userCart) {
                let proIndex = userCart.products.findIndex(product => product.item == id)

                console.log(userCart);
                console.log("product id : " + id);
                console.log(proIndex);
                if (proIndex != -1) {

                    db.get().collection(collection.CART_COLLECTIONS).updateOne({ user: user, 'products.item': ObjectId(id) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })

                } else {
                    db.get().collection(collection.CART_COLLECTIONS).updateOne({ user: user },
                        {

                            $push: { products: productObj }

                        }).then((response) => {
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: user,
                    products: [productObj]
                }
                db.get().collection(collection.CART_COLLECTIONS).insertOne(cartObj).then((result) => {
                    console.log('added to cart');
                    resolve(result)
                })

            }
        })
    },
    pushImages: (id, data) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(id) }, {
                $push: {
                    images: data
                }
            }).then((result) => {
                resolve()
            })
        })
    },
    getorderProducts: ((userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.ORDER_COLLECTIONS)
                .aggregate([
                    {
                        $match: { _id: ObjectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    }, {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    }
                ]).toArray()

            resolve(cartItems)
        })

    }),
    addCoupon: ((coupon) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then(() => {
                console.log("coupon added");
                resolve()
            })
        })
    }),
    addtoWishlist: (id, user) => {
        let productObj = {
            item: ObjectId(id),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.WISHLIST_COLLECTIONS).findOne({ user: user })

            if (userCart) {
                let proIndex = userCart.products.findIndex(product => product.item == id)

                console.log(userCart);
                console.log("product id : " + id);
                console.log(proIndex);
                if (proIndex != -1) {

                    db.get().collection(collection.WISHLIST_COLLECTIONS).updateOne({ user: user, 'products.item': ObjectId(id) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })

                } else {
                    db.get().collection(collection.WISHLIST_COLLECTIONS).updateOne({ user: user },
                        {

                            $push: { products: productObj }

                        }).then((response) => {
                            resolve()
                        })
                }

            } else {
                let cartObj = {
                    user: user,
                    products: [productObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTIONS).insertOne(cartObj).then((result) => {
                    console.log('added to wishlist');
                    resolve(result)
                })

            }
        })
    },
    getwishlist: ((userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.WISHLIST_COLLECTIONS)
                .aggregate([
                    {
                        $match: { user: userId }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    }, {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    }
                ]).toArray()

            resolve(cartItems)
        })

    }),
    couponDetails:((data)=>{
        console.log(".........................data",data);
        return new Promise(async(resolve,reject)=>{
        let details=await db.get().collection(collection.COUPON_COLLECTION).findOne({CouponCode:data})
        console.log("_________________coupons details",details);
        resolve(details)

        })
    }),
    getDiscount: ((userId) => {

        return new Promise(async (resolve, reject) => {
            let totaldiscount = await db.get().collection(collection.CART_COLLECTIONS).aggregate([
                { $match: { _id: userId } }, {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {
                        item:1,
                        quantity:1,
                        product:1,
                        discount:"$product.discount",
                        price:"$product.price"
                    }
                },

                { $match:  {discount:{$gt:"0"} }},

                {
                    $group: {
                        _id: null,
                        discount: { $sum: { "$multiply": [{ $toInt: '$quantity' }, { $toInt: '$product.discount' }, { $toInt: '$product.price' }] } }
                    }
                },
            ]).toArray()
  
            resolve(totaldiscount[0].discount)
        })

    }),
}












