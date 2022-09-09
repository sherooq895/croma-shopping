var db = require('../config/connection')
var collection = require('../config/collections');
const { response } = require('../app');
// const collections = require('../config/collections');
var objectId = require('mongodb').ObjectId


module.exports = {
    addproduct: (product, callback) => {
        console.log(product);

        db.get().collection('product').insertOne(product).then((data) => {
            console.log(data);
            callback(data.insertedId)

        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
            console.log(products)
        })
    },

    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(proId) }).then((response) => {
                resolve()

            })
        })
    },

    deletefProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.FUTUREPRODUCT_COLLECTION).deleteOne({ _id: objectId(proId) }).then((response) => {
                resolve()

            })
        })
    },
    getproductDetailsSingle: (proId) => {
        return new Promise(async(resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(proId) }

                },

            ]).toArray().then((productlist)=>{
                resolve(productlist)
            })
        })
    },
    getproductDetails: (proId) => {
        return new Promise(async(resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(proId) }

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
                    $project: { category: '$category.name', brand: '$brand.name', subcategory: '$subcategory.name', stock: 1, price: 1, cuttingprice: 1, description: 1, images: 1,name:1 }
                }

            ]).toArray().then((productlist)=>{
                resolve(productlist)
            })
        })
    },
   


    updateProduct: (proId, proDetails) => {
        console.log(proDetails);
        console.log('proDetailssss');
        return new Promise(async(resolve, reject) => {
            console.log(proId)
            console.log('proDetails')
            console.log(proDetails)
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: proDetails.category })
            console.log(category);
            let subcategory = await db.get().collection(collection.SUBCATEGORY_COLLECTION).findOne({ name: proDetails.subcategory })
            console.log(subcategory);
            let brand = await db.get().collection(collection.BRANDS_COLLECTION).findOne({ name: proDetails.brand })
            console.log(brand);

            

            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    name: proDetails.name,
                    description: proDetails.description,
                    price: proDetails.price,
                    category:category._id,
                    brand:brand._id,
                    images: proDetails.images,
                    cuttingprice: proDetails.cuttingprice,
                    subcategory:subcategory._id,
                    
                }


            }).then((response) => {
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id: objectId(proId)},{
                    $inc:{
                        stock:parseInt(proDetails.stock)
                    }
                })
                resolve()
            })
            resolve()
        })

    },

    Productslist: () => {
        return new Promise(async (resolve, reject) => {
            const home = {}
            home.category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            home.productlist = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([

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
                        from: collection.CATEGORY_COLLECTION,
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },

                {
                    $project: { category: '$category.name', brand: '$brand.name', price: 1, cuttingprice: 1, images: 1, name: 1,categoryoffer:'$category.categoryoffer',offerpercentage:'$category.offerpercentage' }
                }

            ]).toArray()
            home.futureprolist = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([

                {
                    $lookup: {
                        from: collection.BRANDS_COLLECTION,
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brand'
                    },
                },
                {
                    $project: { brand: '$brand.name', images: 1 }
                }

            ]).limit(4).toArray()
            resolve(home)
        })
    },
    productsmen: (id) => {
        return new Promise(async (resolve, reject) => {
            let productmen = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: { category: objectId(id) }

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
                    $project: { category: '$category.name', brand: '$brand.name', subcategory: '$subcategory.name', stock: 1, price: 1, cuttingprice: 1, description: 1, images: 1,name:1,categoryoffer:'$category.categoryoffer',discountprice:1,offerpercentage:'$category.offerpercentage'}
                }

            ]).toArray()

            console.log('jhgfdfghjkkjhg');
            console.log(productmen);
            resolve(productmen)
        })

    },

    productview: (proId) => {
        console.log("hs" + proId);
        return new Promise(async (resolve, reject) => {
            let productview = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(proId) }

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
                    $project: { category: '$category.name', brand: '$brand.name', name: 1, stock: 1, price: 1, cuttingprice: 1, description: 1, images: 1 }
                }

            ]).toArray()

            console.log('jhgfdfghjkkjhg');
            console.log(productview);
            resolve(productview)
        })
    },
    getproduct: (body) => {
        console.log(body);
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: body.category })
            console.log(category);
            let subcategory = await db.get().collection(collection.SUBCATEGORY_COLLECTION).findOne({ name: body.subcategory })
            console.log(subcategory);
            let brand = await db.get().collection(collection.BRANDS_COLLECTION).findOne({ name: body.brand })
            console.log(brand);
            let proObj = {
                name: body.name,
                category: objectId(category._id),
                brand: objectId(brand._id),
                subcategory: objectId(subcategory._id),
                stock: parseInt(body.stock),
                cuttingprice: body.cuttingprice,
                price: body.price,
                description: body.description,
                images: body.images

            }

            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(proObj).then(() => {
                resolve()
            })

        })
    },


    showproducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([

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
                    $project: { category: '$category.name', brand: '$brand.name', subcategory: '$subcategory.name', name:1,stock: 1, price: 1, cuttingprice: 1, description: 1, images: 1 }
                }

            ]).toArray()
            console.log(products[0])
            console.log(products)
            console.log("products")
            resolve(products)
        })
    },

    menssandels:(catid,subid)=>{
        return new Promise(async (resolve, reject) => {
            let menssandels = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: {category:objectId(catid)}

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
                            $project: {  category: '$category.name',  subcategory: 1,brand:1, name: 1, stock: 1, price: 1, cuttingprice: 1, description: 1, images: 1,categoryoffer:'$category.categoryoffer',offerpercentage:'$category.offerpercentage' }
                        },
                    
                {
                    $match: {subcategory:objectId(subid)}

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
                    $project: { category: 1,  subcategory: '$subcategory.name',brand:'$brand.name', name: 1, stock: 1, price: 1, cuttingprice: 1, description: 1, images: 1,categoryoffer:1 ,offerpercentage:1}
                }

            ]).toArray()

            console.log('sampleee shrqqqqqqq');
            console.log(menssandels);
            resolve(menssandels)
        })

      

    },


    addfutureproduct: (body) => {
        console.log(body);
        return new Promise(async (resolve, reject) => {
           
            let brand = await db.get().collection(collection.BRANDS_COLLECTION).findOne({ name: body.brand })
            console.log(brand);
            let proObj = {
                name: body.name,
              
                brand: objectId(brand._id),
              
                description: body.description,
                images: body.images

            }

            db.get().collection(collection.FUTUREPRODUCT_COLLECTION).insertOne(proObj).then(() => {
                resolve()
            })

        })
    },




}
