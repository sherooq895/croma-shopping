var db = require('../config/connection')
var collection = require('../config/collections');
const { response } = require('../app');
const { ConferenceContext } = require('twilio/lib/rest/insights/v1/conference');
var objectId = require('mongodb').ObjectId





module.exports = {
    // addproduct: (product, callback) => {
    //     console.log(product);

    //     db.get().collection('product').insertOne(product).then((data) => {
    //         console.log(data);
    //         callback(data.insertedId)

    //     })
    // },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
           
            if (user) {
            
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
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },

    deleteUser: (usrId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: objectId(usrId) }).then((response) => {
                resolve()

            })
        })
    },
    getuserDetails: (usrId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(usrId) }).then((user) => {
                console.log(user);
                resolve(user)
            })
        })
    },

    updateUser: (usrId, userDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(usrId) }, {
                $set: {
                    firstname: userDetails.firstname,
                    lastname: userDetails.lastname,
                    email: userDetails.email

                }
            }).then((response) => {
                resolve()

            })
        })

    },
    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    status: false
                }
            })
            resolve()
        })
    },

    unblockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    status: true
                }
            })
            resolve()
        })
    },
    addcategory: (body) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(body).then(() => {
                console.log(body)
                resolve()
            })
        })
    },
    getcategory: () => {
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(data)
        })

    },
    addsubcategory: (body) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.SUBCATEGORY_COLLECTION).insertOne(body).then(() => {
                console.log(body);
                resolve()
            })


        })
    },
    getsubcategory: () => {
        return new Promise(async (resolve, reject) => {
            let subcactegory = await db.get().collection(collection.SUBCATEGORY_COLLECTION).find().toArray()
            resolve(subcactegory)
        })
    }, addbrand: (body) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRANDS_COLLECTION).insertOne(body).then(() => {
                console.log(body);
                resolve()
            })

        })
    }, getallbrands: () => {
        return new Promise(async (resolve, reject) => {
            let brands = await db.get().collection(collection.BRANDS_COLLECTION).find().toArray()
            resolve(brands)
        })
    },
    deletesub: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.SUBCATEGORY_COLLECTION_COLLECTION).deleteOne({ _id: objectId(id) }).then((response) => {
                resolve()

            })
        })




    },

    getorderlist: () => {

      


        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([


                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'

                    }
                },
                {
                    $match: { $or: [{ status: 'placed' }, { status: 'packed' }, { status: 'Shipped' }, { status: 'Out Of Delivery' }, { status: 'Deliverd' }, { status: 'canceled' }] }

                },

                {
                    $project: {
                        name: '$user.name',

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$date" } },
                       
                        deliveryDetails: 1,
                        products: 1

                    }
                },
                {
                    $sort:{"date":-1}
                    },

            ]).toArray()
            console.log()

            resolve(orders)

        })
    },

    product: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: { _id: objectId(orderId) }
                },
                {
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
                        name: '$product.name',
                        price: '$product.price',
                        brand: '$product.brand',
                        category: '$product.category',
                        subcategory: '$product.subcategory',
                        cuttingprice: '$product.cuttingprice',
                        images: '$product.images',

                        description: '$product.description'

                    }
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
                    },
                },
                {
                    $lookup: {
                        from: collection.SUBCATEGORY_COLLECTION,
                        localField: 'subcategory',
                        foreignField: '_id',
                        as: 'subcategory',
                    },
                },
                {
                    $unwind: '$images'
                },

                {
                    $project:
                    {
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },


                        category: '$category.name',
                        subcategory: '$subcategory.name',
                        brand: '$brand.name',
                        name: 1,
                        price: 1,
                        description: 1,
                        images: 1,

                        cuttingprice: 1
                    }

                }
            ]).toArray()
           
            resolve(product)

        })
    },
    deleteorderProduct: (orderId, proId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: "canceled"
                        }
                    }).then((response) => {
                        response.removed = true
                        resolve(response)
                    })
        })
    },
    getsubcategorylist: (proId) => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.SUBCATEGORY_COLLECTION).findOne({ _id: objectId(proId) })
            resolve(category)
        }
        )
    },

    editsubcategorydata: (proId, proData) => {
      
        return new Promise((resolve, reject) => {
            db.get().collection(collection.SUBCATEGORY_COLLECTION).updateOne({ _id: objectId(proId) },
                {
                    $set: {
                        name: proData.name,
                        description: proData.description
                    }
                })
            resolve()
        })


    },

    getcategorylist: (proId) => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(proId) })
            resolve(category)
        }
        )
    },

    editcategorydata: (proId, proData) => {
       
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(proId) },
                {
                    $set: {
                        name: proData.name,
                        description: proData.description,
                        image: proData.image
                    }
                })
            resolve()
        })


    },
    getbrandlist: (proId) => {
       
        return new Promise(async (resolve, reject) => {
            let brand = await db.get().collection(collection.BRANDS_COLLECTION).findOne({ _id: objectId(proId) })
           
            resolve(brand)
        }
        )
    },

    editbranddata: (proId, proData) => {
     
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRANDS_COLLECTION).updateOne({ _id: objectId(proId) },
                {
                    $set: {
                        name: proData.name,
                        description: proData.description

                    }
                })
            resolve()
        })


    },

    addbanner: (body) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).insertOne(body).then(() => {
                console.log(body)
                resolve()
            })
        })
    },

    getbanners: () => {
        return new Promise(async (resolve, reject) => {
            let banners = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
           
            resolve(banners)
        }
        )
    },

    editbanner: (id) => {
        return new Promise(async (resolve, reject) => {
            let banners = await db.get().collection(collection.BANNER_COLLECTION).findOne({ _id: objectId(id) })
           
            resolve(banners)
        }
        )
    },

    deletebanner: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BANNER_COLLECTION).deleteOne({ _id: objectId(id) })
            resolve()
        }
        )
    },

    addcoupen: (body) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPEN_COLLECTION).insertOne(body).then(() => {
                console.log(body)
                resolve()
            })
        })

    },

    getcoupens: () => {
        return new Promise(async (resolve, reject) => {
            let coupens = await db.get().collection(collection.COUPEN_COLLECTION).find().toArray()
            resolve(coupens)
        }
        )

    },

    deletecoupen: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.COUPEN_COLLECTION).deleteOne({ _id: objectId(id) })
            resolve()
        }
        )
    },

    addoffer: (body) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.OFFER_COLLECTION).insertOne(body).then(() => {
                console.log(body)
                resolve()
            })
        })

    },

    showoffers: () => {
        return new Promise(async (resolve, reject) => {
            let offers = await db.get().collection(collection.OFFER_COLLECTION).find().toArray()
            resolve(offers)
        }
        )

    },

    deleteoffer: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.OFFER_COLLECTION).deleteOne({ _id: objectId(id) }).then(() => {

                resolve()
            })
        }
        )

    },

    categoryoffer: (body) => {
       
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(body.category) })
            let offer = await db.get().collection(collection.OFFER_COLLECTION).findOne({ _id: objectId(body.offer) })

            if (category) {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: objectId(body.category) }).toArray()

                products.map(async (products) => {
                    let cuttingprice = products.cuttingprice;
                    let price = products.price;

                    discount = (cuttingprice * offer.Percentage) / 100

                    price = parseInt(cuttingprice - discount)

                    await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ _id: objectId(products._id) },
                        {
                            $set: {
                                cuttingprice: cuttingprice, price: price, offername: offer.name, discountprice: discount, categoryoffer: true,offerpercentage: offer.Percentage
                            }
                        })
                    await db.get().collection(collection.CATEGORY_COLLECTION).updateMany({ _id: objectId(category._id) },
                        {
                            $set: {
                                offername: offer.name, offerpercentage: offer.Percentage, categoryoffer: true
                            }
                        })

                    resolve()

                })


            } else {
                console.log('invalid category');
            }
        })

    },


    deletecategoryoffer: (body) => {

      
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(body.category) })


            if (category) {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: objectId(body.category) }).toArray()

                products.map(async (products) => {
                    let cuttingprice = products.cuttingprice;
                    let price = products.cuttingprice;

                    discount = 0

                    price = parseInt(price - discount)

                    await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ _id: objectId(products._id) },
                        {
                            $set: {
                                cuttingprice: cuttingprice, price: price, offername: null, discountprice: discount, categoryoffer: false
                            }
                        })
                    await db.get().collection(collection.CATEGORY_COLLECTION).updateMany({ _id: objectId(category._id) },
                        {
                            $set: {
                                offername: null, offerpercentage: null, categoryoffer: false
                            }
                        })

                    resolve()

                })


            } else {
                console.log('invalid category');
            }
        })

    },

    orderstatus: (body) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_STATUS).insertOne(body).then(() => {
                console.log(body)
                resolve()
            })
        })

    },

    getorderstatus: () => {
        return new Promise(async (resolve, reject) => {
            let orderstatus = await db.get().collection(collection.ORDER_STATUS).find().toArray()
            resolve(orderstatus)

        }
        )
    },
    orderstatuschange: (body) => {

        return new Promise(async (resolve, reject) => {
            let status = await db.get().collection(collection.ORDER_STATUS).find({ _id: objectId(body.status) }).toArray()
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(body.order) },
                {
                    $set: {
                        status: status[0].name

                    }
                })
            resolve(response)
        })
    },

    getcodamount: () => {
        return new Promise(async (resolve, reject) => {
            let cod = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { paymentmethod: 'COD' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }
                }
            ]).toArray()

            console.log('cod');

            resolve(cod[0].total)
        }
        )
    },

    getrazorpayamount: () => {
        return new Promise(async (resolve, reject) => {
            let Razorpay = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { paymentmethod: 'Razorpay' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }
                }
            ]).toArray()

            resolve(Razorpay[0].total)
        }
        )
    },
    getwalletamount: () => {
        return new Promise(async (resolve, reject) => {
            let wallet = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { paymentmethod: 'wallet' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }
                }
            ]).toArray()

            resolve(wallet[0].total)
        }
        )
    },


    getpaypalamount: () => {
        return new Promise(async (resolve, reject) => {
            let paypal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { paymentmethod: 'paypal' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }
                }
            ]).toArray()

            resolve(paypal[0].total)
        }
        )
    },


    getsalesreprtdata: (body) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'

                    }
                },
                {
                    $match: { $or: [{ status: 'placed' }, { status: 'packed' }, { status: 'Shipped' }, { status: 'Out Of Delivery' }, { status: 'Deliverd' }, { status: 'canceled' }] }

                },

                {
                    $project: {
                        username: '$user.name',

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        products: 1

                    }
                },
                {
                    $project: {

                        date: { $dateToString: { format: "%Y-%m-%d ", date: "$date" } },
                        username: 1,

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,

                        deliveryDetails: 1,
                        products: 1
                    }
                },

                {
                    $match: {
                        $and: [
                            {
                                date: {
                                    $gt: body.start, $lt: body.end

                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        username: 1,

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,


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
                        name: '$product.name',
                        price: '$product.price',
                        brand: '$product.brand',
                        category: '$product.category',
                        subcategory: '$product.subcategory',
                        cuttingprice: '$product.cuttingprice',
                        images: '$product.images',

                        description: '$product.description',


                        quantity: 1,
                        username: 1,

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,

                    }
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
                    },
                },
                {
                    $lookup: {
                        from: collection.SUBCATEGORY_COLLECTION,
                        localField: 'subcategory',
                        foreignField: '_id',
                        as: 'subcategory',
                    },
                },
                {
                    $unwind: '$images'
                },

                {
                    $project:
                    {
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },


                        category: '$category.name',
                        subcategory: '$subcategory.name',
                        brand: '$brand.name',

                        price: 1,
                        description: 1,
                        images: 1,
                        cuttingprice: 1,
                        quantity: 1,
                        name: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        username: 1
                    }




                }
            ]).toArray()
           

            resolve(product)

        })
    },


    getallorderdetailsreport: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'

                    }
                },
                {
                    $match: { $or: [{ status: 'placed' }, { status: 'packed' }, { status: 'Shipped' }, { status: 'Out Of Delivery' }, { status: 'Deliverd' }, { status: 'canceled' }] }

                },

                {
                    $project: {
                        username: '$user.name',

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        products: 1

                    }
                },
                {
                    $project: {

                        date: { $dateToString: { format: "%Y-%m-%d ", date: "$date" } },
                        username: 1,

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,

                        deliveryDetails: 1,
                        products: 1
                    }
                },


                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        name: 1,

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        username: 1,


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
                        name: '$product.name',
                        price: '$product.price',
                        brand: '$product.brand',
                        category: '$product.category',
                        subcategory: '$product.subcategory',
                        cuttingprice: '$product.cuttingprice',
                        images: '$product.images',

                        description: '$product.description',


                        quantity: 1,
                        name: 1,

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        username: 1,

                    }
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
                    },
                },
                {
                    $lookup: {
                        from: collection.SUBCATEGORY_COLLECTION,
                        localField: 'subcategory',
                        foreignField: '_id',
                        as: 'subcategory',
                    },
                },
                {
                    $unwind: '$images'
                },

                {
                    $project:
                    {
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },

                        category: '$category.name',
                        subcategory: '$subcategory.name',
                        brand: '$brand.name',

                        price: 1,
                        description: 1,
                        images: 1,
                        cuttingprice: 1,
                        quantity: 1,
                        name: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        username: 1,
                    }




                }
            ]).toArray()
           
            resolve(product)

        })
    },



    getsaleamount: (body) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'

                    }
                },
                {
                    $match: { $or: [{ status: 'placed' }, { status: 'packed' }, { status: 'Shipped' }, { status: 'Out Of Delivery' }, { status: 'Deliverd' }] }

                },

                {
                    $project: {
                        username: '$user.name',

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        products: 1

                    }
                },
                {
                    $project: {

                        date: { $dateToString: { format: "%Y-%m-%d ", date: "$date" } },
                        username: 1,

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,

                        deliveryDetails: 1,
                        products: 1
                    }
                },

                {
                    $match: {
                        $and: [
                            {
                                date: {
                                    $gt: body.start, $lt: body.end

                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        username: 1,

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,


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
                        name: '$product.name',
                        price: '$product.price',
                        brand: '$product.brand',
                        category: '$product.category',
                        subcategory: '$product.subcategory',
                        cuttingprice: '$product.cuttingprice',
                        images: '$product.images',

                        description: '$product.description',


                        quantity: 1,
                        username: 1,

                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,

                    }
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
                    },
                },
                {
                    $lookup: {
                        from: collection.SUBCATEGORY_COLLECTION,
                        localField: 'subcategory',
                        foreignField: '_id',
                        as: 'subcategory',
                    },
                },
                {
                    $unwind: '$images'
                },

                {
                    $project:
                    {
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },

                        category: '$category.name',
                        subcategory: '$subcategory.name',
                        brand: '$brand.name',
                        price: 1,
                        description: 1,
                        images: 1,
                        cuttingprice: 1,
                        quantity: 1,
                        name: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        username: 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        saletotal: { $sum: '$totalAmount' }
                    }
                },
                {
                    $project: {
                        saletotal: 1
                    }
                }
            ]).toArray()
            console.log(product);


            resolve(product)

        })
    },


    getweeklysaleamount: () => {

        var weekdatee= new Date(
            (new Date().getTime() - (7* 24 * 60 * 60 * 1000))
        )
       var datenowww=new Date()


       
        return new Promise(async (resolve, reject) => {

  let weekdate=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $project: {
                       
                        weekdate: { $dateToString: { format: "%Y-%m-%d ", date: weekdatee } },
                        datenoww: { $dateToString: { format: "%Y-%m-%d ", date: datenowww } },

                    }
                }
            ]).toArray()

            console.log(weekdate);
            console.log('weekdate');





            let product = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'

                    }
                },
                {
                    $match: { $or: [{ status: 'placed' }, { status: 'packed' }, { status: 'Shipped' }, { status: 'Out Of Delivery' }, { status: 'Deliverd' }] }

                },

                {
                    $project: {
                        username: '$user.name',
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        products: 1

                    }
                },
                {
                    $project: {

                        date: { $dateToString: { format: "%Y-%m-%d ", date: "$date" } },
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        deliveryDetails: 1,
                        products: 1,
                        weekdate: new Date(
                            (new Date().getTime() - (7 * 24 * 60 * 60 * 1000))
                        ),
                        datenoww: new Date()
                    }
                },
                {
                    $project: {
                        date: 1,
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        deliveryDetails: 1,
                        products: 1,
                        weekdate: { $dateToString: { format: "%Y-%m-%d ", date: "$weekdate" } },
                        datenoww: { $dateToString: { format: "%Y-%m-%d ", date: "$datenoww" } },

                    }
                },
                {
                    $match: {
                        $and: [
                            {
                                date: {
                                    $gte: weekdate[0].weekdate, $lte: weekdate[0].datenoww

                                }
                            }
                        ]
                    }
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                    }
                },

                {
                    $project: {

                        quantity: 1,
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,

                    }
                },

                {
                    $project:
                    {
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },
                        quantity: 1,
                        name: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        username: 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        saletotal: { $sum: '$totalAmount' }
                    }
                },
                {
                    $project: {
                        saletotal: 1
                    }
                }
            ]).toArray()
           
            resolve(product)

        })
    }
    ,


    getmonthsaleamount: () => {

        
        var weekdatee= new Date(
            (new Date().getTime() - (30* 24 * 60 * 60 * 1000))
        )
       var datenowww=new Date()


       
        return new Promise(async (resolve, reject) => {

            let weekdate=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $project: {
                       
                        weekdate: { $dateToString: { format: "%Y-%m-%d ", date: weekdatee } },
                        datenoww: { $dateToString: { format: "%Y-%m-%d ", date: datenowww } },

                    }
                }
            ]).toArray()

          
            let product = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'

                    }
                },
                {
                    $match: { $or: [{ status: 'placed' }, { status: 'packed' }, { status: 'Shipped' }, { status: 'Out Of Delivery' }, { status: 'Deliverd' }] }

                },

                {
                    $project: {
                        username: '$user.name',
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        products: 1

                    }
                },
                {
                    $project: {

                        date: { $dateToString: { format: "%Y-%m-%d ", date: "$date" } },
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        deliveryDetails: 1,
                        products: 1,
                        weekdate: new Date(
                            (new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                        ),
                        datenoww: new Date()
                    }
                },
                {
                    $project: {
                        date: 1,
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        deliveryDetails: 1,
                        products: 1,
                        weekdate: { $dateToString: { format: "%Y-%m-%d ", date: "$weekdate" } },
                        datenoww: { $dateToString: { format: "%Y-%m-%d ", date: "$datenoww" } },

                    }
                },
                {
                    $match: {
                        $and: [
                            {
                                date: {
                                    $gte: weekdate[0].weekdate, $lte: weekdate[0].datenoww

                                }
                            }
                        ]
                    }
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                    }
                },

                {
                    $project: {

                        quantity: 1,
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,

                    }
                },

                {
                    $project:
                    {
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },
                        quantity: 1,
                        name: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        username: 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        saletotal: { $sum: '$totalAmount' }
                    }
                },
                {
                    $project: {
                        saletotal: 1
                    }
                }
            ]).toArray()
          
            resolve(product)

        })
    }
    ,



    getyearsaleamount: () => {

        var weekdatee= new Date(
            (new Date().getTime() - (365* 24 * 60 * 60 * 1000))
        )
       var datenowww=new Date()

        return new Promise(async (resolve, reject) => {


            let weekdate=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $project: {
                       
                        weekdate: { $dateToString: { format: "%Y-%m-%d ", date: weekdatee } },
                        datenoww: { $dateToString: { format: "%Y-%m-%d ", date: datenowww } },

                    }
                }
            ]).toArray()

            console.log(weekdate);
            console.log('weekdate');

            let product = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'

                    }
                },
                {
                    $match: { $or: [{ status: 'placed' }, { status: 'packed' }, { status: 'Shipped' }, { status: 'Out Of Delivery' }, { status: 'Deliverd' }] }

                },

                {
                    $project: {
                        username: '$user.name',
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        products: 1

                    }
                },
                {
                    $project: {

                        date: { $dateToString: { format: "%Y-%m-%d ", date: "$date" } },
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        deliveryDetails: 1,
                        products: 1,
                        weekdate: new Date(
                            (new Date().getTime() - (365 * 24 * 60 * 60 * 1000))
                        ),
                        datenoww: new Date()
                    }
                },
                {
                    $project: {
                        date: 1,
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        deliveryDetails: 1,
                        products: 1,
                        weekdate: { $dateToString: { format: "%Y-%m-%d ", date: "$weekdate" } },
                        datenoww: { $dateToString: { format: "%Y-%m-%d ", date: "$datenoww" } },

                    }
                },
                {
                    $match: {
                        $and: [
                            {
                                date: {
                                    $gte: weekdate[0].weekdate, $lte: weekdate[0].datenoww


                                }
                            }
                        ]
                    }
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                    }
                },

                {
                    $project: {

                        quantity: 1,
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,

                    }
                },

                {
                    $project:
                    {
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },
                        quantity: 1,
                        name: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        username: 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        saletotal: { $sum: '$totalAmount' }
                    }
                },
                {
                    $project: {
                        saletotal: 1
                    }
                }
            ]).toArray()
           
            resolve(product)

        })
    },


    getdaysaleamount: () => {

       var weekdatee= new Date(
            (new Date().getTime() - (1* 24 * 60 * 60 * 1000))
        )
       var datenowww=new Date()

      

      
        return new Promise(async (resolve, reject) => {
            let weekdate=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $project: {
                       
                        weekdate: { $dateToString: { format: "%Y-%m-%d ", date: weekdatee } },
                        datenoww: { $dateToString: { format: "%Y-%m-%d ", date: datenowww } },

                    }
                }
            ]).toArray()

            let product = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'

                    }
                },
                {
                    $match: { $or: [{ status: 'placed' }, { status: 'packed' }, { status: 'Shipped' }, { status: 'Out Of Delivery' }, { status: 'Deliverd' }] }

                },

                {
                    $project: {
                        username: '$user.name',
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        products: 1

                    }
                },
                {
                    $project: {

                        date: { $dateToString: { format: "%Y-%m-%d ", date: "$date" } },
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        deliveryDetails: 1,
                        products: 1,
                        weekdate: new Date(
                            (new Date().getTime() - (1* 24 * 60 * 60 * 1000))
                        ),
                        datenoww: new Date()
                    }
                },
                {
                    $project: {
                        date: 1,
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        deliveryDetails: 1,
                        products: 1,
                        weekdate: { $dateToString: { format: "%Y-%m-%d ", date: "$weekdate" } },
                        datenoww: { $dateToString: { format: "%Y-%m-%d ", date: "$datenoww" } },

                    }
                },
                {
                    $match: {
                        $and: [
                            {
                                date: {
                                    // $gte: weekdate[0].weekdate, $lte: weekdate[0].datenoww
                                    $eq: weekdate[0].datenoww

                                }
                            }
                        ]
                    }
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                    }
                },

                {
                    $project: {

                        quantity: 1,
                        username: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,

                    }
                },

                {
                    $project:
                    {
                        product: {
                            $arrayElemAt: ['$product', 0]
                        },
                        quantity: 1,
                        name: 1,
                        totalAmount: 1,
                        paymentmethod: 1,
                        status: 1,
                        date: 1,
                        deliveryDetails: 1,
                        username: 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        saletotal: { $sum: '$totalAmount' }
                    }
                },
                {
                    $project: {
                        saletotal: 1
                    }
                }
            ]).toArray()
           
            resolve(product)

        })
    },


    getdatacount:()=>{
        return new Promise(async(resolve,reject)=>{

            var usercount=await db.get().collection(collection.USER_COLLECTION).count()
           
            resolve(usercount)

        })
    },


    getordercount:()=>{
        return new Promise(async(resolve,reject)=>{

            var ordercount=await db.get().collection(collection.ORDER_COLLECTION).count()
           
            resolve(ordercount)

        })
    },

    getplacedordercount:()=>{
        return new Promise(async(resolve,reject)=>{

            var ordercount=await db.get().collection(collection.ORDER_COLLECTION).count({status:'placed'})
            
            resolve(ordercount)

        })
    }
    ,
    getcodordercount:()=>{
        return new Promise(async(resolve,reject)=>{

            var ordercount=await db.get().collection(collection.ORDER_COLLECTION).count({paymentmethod:'COD'})
          
            resolve(ordercount)

        })
    },

    getwalletordercount:()=>{
        return new Promise(async(resolve,reject)=>{

            var ordercount=await db.get().collection(collection.ORDER_COLLECTION).count({paymentmethod:'wallet'})
           
            resolve(ordercount)

        })
    },

    getRazorpayordercount:()=>{
        return new Promise(async(resolve,reject)=>{

            var ordercount=await db.get().collection(collection.ORDER_COLLECTION).count({paymentmethod:'Razorpay'})
          
            resolve(ordercount)

        })
    },

    getpaypalordercount:()=>{
        return new Promise(async(resolve,reject)=>{

            var ordercount=await db.get().collection(collection.ORDER_COLLECTION).count({paymentmethod:'paypal'})
           
            if(ordercount){

                resolve(ordercount)
            }else{
                ordercount=0
                resolve(ordercount)
            }

        })
    },

    getfproducts:()=>{
       
        return new Promise(async(resolve,reject)=>{
           var fproducts=await db.get().collection(collection.FUTUREPRODUCT_COLLECTION).find().toArray()
          
           resolve(fproducts)
        })

    }













}
