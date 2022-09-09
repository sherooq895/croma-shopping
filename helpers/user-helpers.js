var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response, options } = require('../app');
const { CART_COLLECTION } = require('../config/collections');
var objectId = require('mongodb').ObjectId
require('dotenv').config()
const Razorpay = require('razorpay');
const { resolve } = require('path');
const paypal = require('paypal-rest-sdk')
const CC = require('currency-converter-lt');
const { product } = require('./admin-helper');
const client = require('twilio')(process.env.ACCOUNTSSID, process.env.AUTHTOKEN);
// const { Promise } = require('mongodb');

var instance = new Razorpay({
    key_id: 'rzp_test_JZLCe2VwIjfiSM',
    key_secret: 'WbzKoMULgze3aZakMWCQJqWi',
});


paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'ATPDrzWoWPvWKAgVH4txZObOFHo5y_4KxlyRbyP6gZLyg66euXcuy_A1fl07NU-Pmx4ASDmW0WoPIQL1',
    'client_secret': 'EPw6OwSrUFP-2Yyi3nygI28v1VQXTIMxr02NVx71bbNSPvY4IwOL2G7SdvuHU8Zvby4cfAwERlYZ54q9'
});





module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {};
            let mobile = await db.get().collection(collection.USER_COLLECTION).findOne({ number: userData.number })
            let mail = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (mobile) {
                console.log(mobile)
                response.status = false;
                resolve(response)

            } else if (mail) {
                console.log(mail)
                response.status = false;
                resolve(response)

            } else {
                console.log('gffffffffffffffffff');
                userData.password = await bcrypt.hash(userData.password, 10)
                client.verify.services(process.env.SERVICEID).verifications.create({
                    to: `+91${userData.number}`,
                    channel: 'sms',
                })
                    .then((data) => {
                        console.log(data);
                        res.status(200).send(data)
                    })
                response.status = true;
                console.log(mobile);
                console.log('mobile');
                
                var refferal = parseInt(userData.number)
                let newReferralCode = refferal.toString(16)
                userData.yourReferralCode = newReferralCode
                resolve(userData)

            }


        })
    },
    reSendOtp: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {};
            let mobile = await db.get().collection(collection.USER_COLLECTION).findOne({ number: userData.number })
            let mail = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (mobile) {
                console.log(mobile)
                response.status = false;
                resolve(response)

            } else if (mail) {
                console.log(mail)
                response.status = false;
                resolve(response)

            } else {
                client.verify.services(process.env.SERVICEID).verifications.create({
                    to: `+91${userData.number}`,
                    channel: 'sms',
                })
                    .then((data) => {
                        console.log(data);
                        res.status(200).send(data)
                    })
                response.status = true;
                resolve(userData)

            }


        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            
           

            if (user) {
                console.log(user.password)
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        if (user.status) {
                            console.log("login success")
                            response.user = user
                            response.status = true
                            resolve(response)
                        } else {
                            console.log("login failed")
                            response.status = false
                            resolve(response)
                        }
                    } else {
                        console.log("login failed")
                        resolve({ status: false })
                    }
                })
               

            } else {
                console.log('login failed')
                resolve({ status: false })
            }


        })
    },

    otp: (otp, userData) => {
        console.log(otp)
        console.log("otp")
        console.log(userData)
        console.log('userData')
        // console.log("userData")
        return new Promise(async (resolve, reject) => {
            client.verify.services(process.env.SERVICEID)
                .verificationChecks.create(
                    {
                        to: `+91${userData.number}`,
                        code: otp.otp
                    })
                .then((data) => {
                    console.log(data);
                    console.log("datatest");
                    if (data.status == 'approved') {
                        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(async (data) => {
                          
                            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
                         
                            var dataa = {
                                walletamount: 0,
                                user: user._id
                            }
                            db.get().collection(collection.WALLET_COLLECTION).insertOne(dataa).then(() => {
                                console.log('sss');
                            })
                            console.log(data);

                            if(userData.yourReferralCode){

                                var refferal=await db.get().collection(collection.USER_COLLECTION).findOne({yourReferralCode:userData.yourReferralCode})
                                if(refferal){
                                    db.get().collection(collection.WALLET_COLLECTION).updateOne({ user:data.insertedId }, {
                                        $set: {
                                            walletamount:parseInt('2000')
                    
                                        }
                                    })
                                }
                            }else{

                            }

                            resolve({ status: true })
                        })

                    } else {
                        resolve({ status: false })

                    }



                })
        })
    },

    addtocart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let usercart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (usercart) {
                let proExist = usercart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist !== -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {

                            $push: { products: proObj }


                        }
                    ).then((response) => {
                        resolve()

                    })
                }
            } else {

                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })

            }

        }

        )
    },

    getcartproducts: (userId) => {
        console.log(userId)
        console.log("userIdwwwwwwwww")
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }

                },
                {
                    $unwind: '$products'
                }, {
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
                        item: 1,
                        quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                // {
                //     $lookup:{
                //         from:collection.BRANDS_COLLECTION,
                //         localField:'brand',
                //         foreignField:'_id',
                //         as:'brand'

                //     }
                // }



            ]).toArray()
            // console.log(cartItems[0].products)

            // console.log("cartItems[0].cartItems")
            if (cartItems.length == 0) {
                console.log('sheroooqqqqqqqqq');
                cartItems.carterror = true

            }
            resolve(cartItems)

        })




    },
    getcartcount: (userId) => {

        return new Promise(async (resolve, reject) => {

            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length

                resolve(count)
            }

            else {
                resolve()

            }



        })
    },
    deleteCartProduct: (cartId, proId) => {

        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(cartId) },
                    {
                        $pull: { products: { item: objectId(proId) } }
                    }).then((response) => {
                        response.removed = true
                        resolve(response)
                    })
        })
    },

    changeProductQuantity: (details) => {
        console.log(details);
        console.log('details');
        details.count = parseInt(details.count)
        return new Promise((resolve, reject) => {


            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }).then((response) => {


                        resolve({ status: true })
                    })
        })
    },
    getTotalAmount: (userId) => {
        console.log(userId)
        console.log("userId")
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }

                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
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
                        item: 1,
                        quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.price' }] } }


                    }
                }
            ]).toArray()
            console.log(total);
            resolve(total[0].total)

        })
    },
    placeOrder: (body, order, products, total) => {
        console.log(order);
        console.log('order');


        console.log('order.address.userId');


        return new Promise((resolve, reject) => {

            let status = body['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.address[0].phone,
                    address: order.address[0].address,
                    pincode: order.address[0].pinnumber
                },
                userId: objectId(order.address[0].userId),
                paymentmethod: body['payment-method'] || body['payment-method-w'],
                products: products,
                totalAmount: total,
                status: status,
                date: new Date()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                console.log(response);
                if (body['payment-method'] === 'COD') {

                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.address[0].userId) })
                    console.log(response.insertedId);
                }

                resolve(response.insertedId)

            })



        })

    },
    deleteordercartproduct: (id) => {
        console.log(id);
        console.log('ffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(id) })

        })

    },


    getCartproductList: (userId) => {
        console.log(userId);
        console.log('userId');
        return new Promise(async (resolve, reject) => {


            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            console.log(cart);
            console.log("llllllllllllllllllll");
            resolve(cart.products)
        })
    },
    getorderlist: (userId) => {

        console.log(userId);


        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { userId: objectId(userId) }

                },
                {
                    $match: { $or: [{ status: 'placed' }, { status: 'packed' }, { status: 'Shipped' }, { status: 'Out Of Delivery' }, { status: 'Deliverd' }, { status: 'canceled' }] }

                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1

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
                        item: 1,
                        quantity: 1,
                        totalAmount: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]

                        },
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$date" } },
                        deliveryDetails: 1
                    }
                },
                {
                    $sort: { "date": -1 }
                },
              

            ]).toArray()
            console.log(orders)

            console.log('orderskkkkkkkkk')
            resolve(orders)

        })
    },
    generateRazorpay: (orderId, total) => {
        console.log(orderId);
        console.log('orderId');
        console.log(total);
        console.log('total');
        return new Promise(async (resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('new order: ', order)
                    order.razorpay = true
                    resolve(order)

                }

            })


        })

    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')

            let hmac = crypto.createHmac('sha256', 'WbzKoMULgze3aZakMWCQJqWi');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                console.log('fffaaaaaaaaa');

                resolve()
            } else {
                console.log('dfffff');
                reject()
            }

        })

    },
    changePaymentStatus: (orderId) => {
        console.log(orderId);
        console.log('order2222222222');
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }).then(() => {
                    resolve()
                })

        })


    },

    deleteorderProduct: (orderId, proId, userId) => {
        return new Promise(async (resolve, reject) => {
            db.get()
                .collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: "canceled"
                        }
                    }).then(async (response) => {
                        response.removed = true

                        let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) })
                        if (order.paymentmethod !== 'COD') {

                            await db.get().collection(collection.WALLET_COLLECTION).updateOne({ user: objectId(userId) }, {
                                $inc: {
                                    walletamount: order.totalAmount
                                }

                            }).then(() => {
                                resolve()
                            })

                            console.log(order);
                            console.log('orderrrrrrr');
                            let proObj = {
                                orderId: objectId(orderId),
                                orderdate: order.date,
                                walletamount: 0,
                                balancepaymentamount: 0,
                                orderamount: order.totalAmount,
                                paymentmethod: order.paymentmethod,
                                status: 'Credit'
                            }
                            await db.get().collection(collection.WALLET_COLLECTION).updateOne({ user: objectId(userId) },
                                {

                                    $push: { wallethistory: proObj }

                                }
                            ).then(() => {

                            })

                        }

                        resolve(response)
                    })
        })
    },

    showorderslist: (cartId) => {
        console.log(cartId);
        console.log('userIdfffffffffffffff');


        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(cartId) }

                },
                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1

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
                        item: 1,
                        quantity: 1,
                        totalAmount: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]

                        },
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1
                    },

                },
                // {
                //     $sort:{date:1}
                // },
                // {
                //     $project: {
                //         item: 1,
                //         quantity: 1,
                //         totalAmount: 1,
                //         product: {
                //             $arrayElemAt: ['$product', 0]

                //         },
                //         totalAmount: 1,
                //         paymentmethod: 1,
                //         status: 1,
                //         date: 1,
                //         deliveryDetails: 1
                //     },

                // },
            ]).toArray()
            console.log(orders)

            console.log('orderskkkkkkkkk')
            resolve(orders)

        })
    },

    addaddress: (userData) => {
        console.log(userData);
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).insertOne(userData).then((data) => {
                console.log(data);
                resolve()

            })

        })


    },

    showaddress: (userId) => {
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ userId: (userId) }).toArray()
            console.log(address);
            console.log('address');
            resolve(address)
        })

    },

    deleteaddress: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({ _id: objectId(orderId) }).then(() => {
                resolve()
            })
        })
    },

    editaddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            console.log(address);
            console.log('addressffffff');
            resolve(address)
        })
    },

    editprofiledata: (userId, userData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        name: userData.name,
                        email: userData.email,
                        number: userData.phone

                    }
                })
            resolve()
        })

    },


    getcoupenAmount: (data, total) => {
        console.log(data);
        console.log('dataaaaaaaaaaaaa');
        console.log(total);

        return new Promise(async (resolve, reject) => {
            let dicscounttotal = await db.get().collection(collection.COUPEN_COLLECTION).aggregate([
                {
                    $match: { $expr: data.coupen }

                }, {
                    $project: {
                        name: 1,
                        Percentage: 1,
                        Exparedate: 1
                    }
                }
                , {
                    $sum: { $multiply: [{ $toInt: 'Percentage' }, { $toInt: 'total' }] }
                },


            ]).toArray()
            console.log(dicscounttotal);
            console.log('dicscounttotal');
            resolve()
        })
    },
    coupencheck: (userId, data, total) => {

        let response = {}
        return new Promise(async (resolve, reject) => {
            let coupenn = await db.get().collection(collection.COUPEN_COLLECTION).findOne({ name: data.coupen })


            if (coupenn) {
                user = await db.get().collection(collection.COUPEN_COLLECTION).findOne({ name: data.coupen, user: objectId(userId) })
                if (user) {
                    response.coupen = false
                    resolve(response)
                    console.log('failed');
                } else {
                    console.log(coupenn.minimumamount);
                    console.log('coupenn.minimumamount');
                    console.log(coupenn.maximumamount);
                    console.log(total);

                    if (coupenn.minimumamount <= total && total <= coupenn.maximumamount) {
                        let date = new Date()
                        let expdate = new Date(coupenn.Exparedate)
                        console.log(expdate);
                        if (date <= expdate) {
                            await db.get().collection(collection.COUPEN_COLLECTION).updateOne(
                                {
                                    name: data.coupen
                                },
                                {
                                    $push: {
                                        user: objectId(userId)

                                    }
                                })
                            response.coupenn = coupenn
                            response.coupen = true
                            resolve(response)
                        } else {
                            response.coupen = false
                            resolve(response)
                            console.log('expire');
                        }

                    } else {
                        response.coupen = false
                        resolve(response.coupen = false)
                        console.log('invalid coupen');

                    }


                }

            } else {
                resolve(response.coupen = false)
                console.log('invalid coupen');
            }
        }
        )
    },


    getaddressoder: (userId) => {
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ _id: objectId(userId) }).toArray()
            console.log(address);
            console.log('address');
            resolve(address)
        })

    },

    getwalletamount: (userId) => {
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let wallet = await db.get().collection(collection.WALLET_COLLECTION).find({ user: objectId(userId) }).toArray()
            console.log(wallet);
            console.log('walletccccccc');
            resolve(wallet)
        })

    },
    changewalletamount: (userId, amount) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WALLET_COLLECTION).updateOne({ user: objectId(userId) },
                {
                    $set: {
                        walletamount: amount

                    }
                })
            resolve()
        })

    },

    changepassword: (body) => {
        console.log(body);
        return new Promise(async (resolve, reject) => {
            password = await bcrypt.hash(body.password, 10)
            console.log(password);
            console.log('password');
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(body.userId) },
                {
                    $set: {
                        password: password

                    }
                })
            resolve()
        })

    },

    stockdecriment: (products) => {
        console.log(products);
        console.log('productssherooooooqqqqqqqqq');
        return new Promise((resolve, reject) => {

            for (i = 0; i < products.length; i++) {
                console.log(products.length);
                console.log('products.length');
                console.log(products[i].quantity);
                console.log('products.quantity');
                products[i].quantity = parseInt(products[i].quantity)
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: products[i].item }, {
                    $inc: {
                        stock: -products[i].quantity

                    }
                })
            }


            resolve()
        })

    },

    stockincriment: (orderId) => {
        console.log(orderId);
        console.log('productssherooooooqqqqqqqqq');
        return new Promise(async (resolve, reject) => {

            var products = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) })
            console.log(products);
            console.log('products');


            for (i = 0; i < products.products.length; i++) {

                products.products[i].quantity = parseInt(products.products[i].quantity)
                await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: products.products[i].item }, {
                    $inc: {
                        stock: products.products[i].quantity

                    }
                })
            }


            resolve()
        })

    },


    generatepaypal: (orderId, total) => {
        console.log(orderId);
        console.log('orderId');
        console.log(total);
        console.log('total');
        return new Promise(async (resolve, reject) => {
            console.log('paypaaaalll');

            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/order-success",
                    "cancel_url": "http://localhost:3000/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "Red Sox Hat",
                            "sku": "001",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "Hat for the best team ever"
                }]
            };

            paypal.payment.create(create_payment_json, function (error, payment) {
                console.log('paaayyypaaaaaaaaaallllll');
                if (error) {
                    throw error;
                } else {
                    resolve(payment)

                }
            }
            );





        })

    },
    converter: (price) => {
        console.log(price);
        console.log('shhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh');
        return new Promise((resolve, reject) => {

            let currencyConverter = new CC({
                from: "INR",
                to: "USD",
                amount: price,
                isDecimalComma: false,
            });
            currencyConverter.convert().then((response) => {
                resolve(response)
            });
        });

    },



    deleteCartProductt: (body) => {
        console.log(body);
        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(body.user) },
                {
                    $pull: {
                        products: { item: objectId(body.product) }

                    }
                })
            resolve()
        })

    },

    checkwallet: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WALLET_COLLECTION).findOne({ user: objectId(userId) }).then((response) => {
                console.log(response);
                console.log('response');

                resolve(response)
            })

        })

    },


    deleteorderpending: () => {

        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.ORDER_COLLECTION).deleteMany({ status: 'pending' }).then(() => {

                resolve()
            })
        })

    },


    getorderpoductdetails: (orderId) => {

        console.log(orderId);


        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }

                },
                {
                    $match: { $or: [{ status: 'placed' }, { status: 'packed' }, { status: 'Shipped' }, { status: 'Out Of Delivery' }, { status: 'Deliverd' }, { status: 'canceled' }] }

                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1

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
                        item: 1,
                        quantity: 1,
                        totalAmount: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]

                        },
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1
                    }
                },


            ]).toArray()
            console.log(orders)

            console.log('orderskkkkkkkkk')
            resolve(orders)

        })
    },
    showoinvoice: (orderid, proid) => {

        console.log('userIdfffffffffffffff');


        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderid) }

                },
                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1

                    }
                },
                {
                    $match: {
                        item: objectId(proid)
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
                        item: 1,
                        quantity: 1,
                        totalAmount: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]

                        },
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1
                    }
                },
            ]).toArray()
            console.log(orders)

            console.log('orderskkkkkkkkk')
            resolve(orders)

        })
    },

    wallethistoryadd: (orderId, walletamount, totalprice, userId) => {

        return new Promise(async (resolve, reject) => {

            var order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) })
            console.log(order);
            console.log('orderrrrrrr');
            let proObj = {
                orderId: objectId(orderId),
                orderdate: order.date,
                walletamount: walletamount,
                balancepaymentamount: totalprice,
                orderamount: order.totalAmount,
                paymentmethod: order.paymentmethod,
                status: 'Debit'
            }



            await db.get().collection(collection.WALLET_COLLECTION).updateOne({ user: objectId(userId) },
                {

                    $push: { wallethistory: proObj }

                }
            ).then(() => {

            })
        })

    },

    getwalletreport: (userId) => {
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let wallet = await db.get().collection(collection.WALLET_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },

                // {
                //     $project:{
                //         orderId:1,
                //         orderdate:1,
                //         walletamount:1,
                //         balancepaymentamount:1,
                //         orderamount:1,
                //         paymentmethod:1,
                //         status:1

                //     }
                // },
                // {
                //     $sort:{"orderdate":-1}
                //     },

            ]).toArray()
            console.log(wallet);
            console.log('walletccccccc');
            resolve(wallet[0].wallethistory)
        })

    },

    addtowishlist: (proId, usrId) => {

        return new Promise(async (resolve, reject) => {
            var user = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(usrId) })
            if (user) {

                var userr = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(usrId), products: { $in: [objectId(proId)] } })
                if (userr) {
                    console.log('oooohhhsshhh');
                    resolve()
                } else {
                    console.log('ssssssssssss');
                    await db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(usrId) },
                        {
                            $push: { products: objectId(proId) }
                        }).then((response) => {
                            resolve(response)

                        })

                }

            } else {
                console.log('jjjjjjjjjjjjjjjjjjjj');

                var proObj = {
                    user: objectId(usrId),
                    product: [objectId(proId)]
                }
                await db.get().collection(collection.WISHLIST_COLLECTION).insertOne(proObj).then((response) => {
                    resolve(response)

                })
            }

        }
        )

    },


    getwishlistpro: (userId) => {

        return new Promise(async (resolve, reject) => {
            var proData = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                { $match: { user: objectId(userId) } },
                {
                    $unwind: "$products"
                },

                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products',
                        foreignField: '_id',
                        as: 'product'
                    }
                },


                {
                    $project: {
                        user: 1,
                        proId: '$product._id',

                        product: '$product.name',
                        category: '$product.category',
                        image: '$product.images',
                        price: '$product.price',
                        brand: '$product.brand'

                    }
                },
                {
                    $unwind: '$image'

                },
                {
                    $lookup: {
                        from: collection.CATEGORY_COLLECTION,
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                {
                    $lookup: {
                        from: collection.BRANDS_COLLECTION,
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brand'
                    }
                },
                {
                    $project: {
                        user: 1,
                        proId: 1,

                        product: 1,
                        category: '$category.name',
                        image: 1,
                        price: 1,
                        brand: '$brand.name'

                    }
                }

            ]).toArray()
            console.log(proData);
            console.log('proData');
            resolve(proData)
        }
        )
    },


    deletewishlistProduct: (walletId, proId) => {
        console.log(walletId);
        console.log('walletId');
        console.log(proId);
        return new Promise((resolve, reject) => {

            db.get()
                .collection(collection.WISHLIST_COLLECTION)
                .updateOne({ _id: objectId(walletId) },
                    {
                        $pull: { products: objectId(proId) }
                    }).then((response) => {
                        console.log('sssss');
                        response.removed = true
                        resolve(response)
                    })


        })
    },


    deletewishlistProductt: (walletId, proId) => {
        console.log(walletId);
        console.log('walletId');
        console.log(proId);
        return new Promise((resolve, reject) => {

            db.get()
                .collection(collection.WISHLIST_COLLECTION)
                .updateOne({ user: objectId(walletId) },
                    {
                        $pull: { products: objectId(proId) }
                    }).then((response) => {
                        console.log('sssss');
                        response.removed = true
                        resolve(response)
                    })


        })
    },

    getwishlistproId: (userId) => {

        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).find({ user: objectId(userId) }).toArray().then((response) => {

                console.log(response);
                console.log('proData');
                resolve(response)
            })
        }
        )
    },



    showtotalinvoice: (orderid) => {

        console.log('userIdfffffffffffffff');


        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderid) }

                },
                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1

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
                        item: 1,
                        quantity: 1,
                        totalAmount: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]

                        },
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$date" } },
                        deliveryDetails: 1
                    }
                },


            ]).toArray()
            console.log(orders)

            console.log('orderskkkkkkkkkkkkkinvoice')
            resolve(orders)

        })
    },

    // getbanners:(userId)
    getbanners: () => {
        return new Promise(async (resolve, reject) => {
            let banners = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            console.log(banners);
            console.log('brand');
            resolve(banners)
        }
        )
    },

    getfproducts: () => {
        console.log('sjsjsjsjs');
        return new Promise(async (resolve, reject) => {
            var fproducts = await db.get().collection(collection.FUTUREPRODUCT_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: collection.BRANDS_COLLECTION,
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brand'
                    }
                },
                {
                    $project: {
                        name: 1,
                        images: 1,
                        brand: '$brand.name'
                    }
                }
            ]).toArray()
            console.log(fproducts);
            console.log('fproductsmmmmmmmmmmmmm');
            resolve(fproducts)
        })

    }





}