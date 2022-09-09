var express = require('express');
const { render, response } = require('../app');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var producthelpers = require('../helpers/product-helpers');
var adminhelpers = require('../helpers/admin-helper');
const userHelpers = require('../helpers/user-helpers');
const multer = require('multer');
const session = require('express-session');
const { FindCursor, ObjectId, Db } = require('mongodb');



const adminlog = (req, res, next) => {
  if (req.session.adminLogin) {
    next()
  } else {
    res.render('admin/login')
  }

}







/* GET users listing. */
router.get('/', adminlog, async (req, res, next) => {
  try {
    if (req.session.adminLogin) {
      let amountcod = await adminhelpers.getcodamount()
      let amountrazorpay = await adminhelpers.getrazorpayamount()
      let amountwallet=await  adminhelpers.getwalletamount()
      let amountpaypal = await adminhelpers.getpaypalamount()
      let count = await adminhelpers.getdatacount()
      let order = await adminhelpers.getordercount()
      let placeorder = await adminhelpers.getplacedordercount()
      var yearamount = await adminhelpers.getyearsaleamount()
      var codorder = await adminhelpers.getcodordercount()
      var walletorder = await adminhelpers.getwalletordercount()
      var razorpayorder = await adminhelpers.getRazorpayordercount()
      var paypalorder = await adminhelpers.getpaypalordercount()


      res.render('admin/index', { admin: true, amountcod, amountrazorpay, amountpaypal,amountwallet, count, order, placeorder, yearamount, codorder, walletorder, razorpayorder, paypalorder })
      // res.render('admin/index', { admin: true})
    } else {
      res.render('admin/login')
    }

  }
  catch (error) {
    res.render('admin/400')
  }




});


router.get('/login', function (req, res, next) {
  try {

    res.render('admin/login')
  }
  catch (error) {
    res.render('admin/400')
  }
})

router.get('/400', function (req, res, next) {
  res.render('admin/400')
})

router.post('/login', function (req, res, next) {


  try {
    console.log(req.body)

    var emaildb = "admin@gmail.com"
    var passworddb = "aaa"

    const { Email, password } = req.body
    if (emaildb == Email && passworddb == password) {
      req.session.adminLogin = true
      res.redirect('/admin')
    }
    else {
      req.session.adminerror = true
      res.render('admin/login')
    }

  }
  catch (error) {
    res.render('admin/400')
  }


})



router.get('/add-user', adminlog, function (req, res, next) {

  try {
    // if (req.session.adminLogin) {
    //   res.render('admin/add-user', { admin: true })
    // }
  }
  catch (error) {
    res.render('admin/400')
  }

})



router.get('/add-product', adminlog, async (req, res, next) => {
  try {

    if (req.session.adminLogin) {
      let getsubcategory = await adminhelpers.getsubcategory()
      let getcategory = await adminhelpers.getcategory()
      let getbrands = await adminhelpers.getallbrands()
      res.render('admin/add-product', { admin: true, getsubcategory, getcategory, getbrands })
    }
  } catch (error) {
    res.render('admin/400')
  }
})


router.get('/user-data', adminlog, function (req, res, next) {

  try {
    if (req.session.adminLogin) {
      adminhelpers.getAllUsers().then((users) => {
        res.render('admin/user-data', { admin: true, users })
      }).catch(error => {
        res.render('admin/400')
      })
    }

  }
  catch (error) {
    res.render('admin/400')
  }


})


const filestorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/product-images')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '--' + file.originalname)
  }
})
const upload = multer({ storage: filestorageEngine })


router.post('/add-product', upload.array('images'), (req, res) => {

  try {

    var filenames = req.files.map(function (file) {
      return file.filename;
    });
    req.body.images = filenames;
    producthelpers.getproduct(req.body).then(() => {
      res.redirect('/admin/show-product')
    })


  }
  catch (error) {
    res.render('admin/400')
  }



})


router.get('/show-product', adminlog, function (req, res, next) {

  try {
    if (req.session.adminLogin) {
      productHelpers.showproducts().then((products) => {
        res.render('admin/show-product', { admin: true, products })
      })
    }


  }
  catch (error) {
    res.render('admin/400')
  }

});



router.get("/edit-product/:id", adminlog, async (req, res) => {

  try {
      console.log('req.params.id');
      console.log(req.params.id);
      let product = await productHelpers.getproductDetails(req.params.id)
      let getsubcategory = await adminhelpers.getsubcategory()
      let getcategory = await adminhelpers.getcategory()
      let brand=await adminhelpers.getallbrands() 
      console.log(product);
      console.log('producttttttttttttttttttt');

     
      res.render('admin/edit-product', { admin: true, product, getsubcategory, getcategory,brand })
  } catch (error) {
    res.render('admin/400')
  }

});


router.post('/edit-product/:id', upload.array('images'), async (req, res) => {

  try {
    console.log('shshsshseditproduct');
    console.log(req.files);
    
    if(req.files){
      var filenames = req.files.map(function (file) {
        return file.filename;
      });
      req.body.images = filenames;
    }else{
      let product = await productHelpers.getproductDetailsSingle(req.params.id);
      console.log('product');
      console.log(product);
      req.body.images = product[0].images;
    }
    console.log('shshsshseditproduct');
    console.log(req.body);
    console.log('req.bodyyyyy');
    productHelpers.updateProduct(req.params.id, req.body).then(() => {
      res.redirect('/admin/show-product')
    })


  }
  catch (error) {
    res.render('admin/400')
  }

});


router.get('/delete-product/:id', adminlog, (req, res) => {

  try {
    if (req.session.adminLogin) {
      let proId = req.params.id
      productHelpers.deleteProduct(proId).then(() => {
        res.redirect('/admin/show-product')
      })
    }

  }
  catch (error) {
    res.render('admin/400')
  }

})


router.get('/blockuser/:id', adminlog, (req, res) => {

  try {
    adminhelpers.blockUser(req.params.id).then((response) => {

      res.redirect('/admin/user-data')
    })

  }
  catch (error) {
    res.render('admin/400')
  }

})


router.get('/unblockuser/:id', adminlog, (req, res) => {

  try {
    adminhelpers.unblockUser(req.params.id).then((response) => {
      res.redirect('/admin/user-data')
    })

  }
  catch (error) {
    res.render('admin/400')
  }

})


router.get('/logout', function (req, res, next) {

  try {
    req.session.adminLogin = null;
    res.redirect('/login')

  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/all-category', adminlog, (req, res, next) => {

  try {
    if (req.session.adminLogin) {

      adminhelpers.getcategory().then((category) => {
        console.log(category);
        console.log('category');
        res.render('admin/all-category', { admin: true, category })
      })
    }

  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/sub-category', adminlog, function (req, res, next) {

  try {
    if (req.session.adminLogin) {
      adminhelpers.getsubcategory().then((subcactegory) => {
        res.render('admin/sub-category', { admin: true, subcactegory })
      })
    }
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.post('/add-subcategory', function (req, res, next) {

  try {
    adminhelpers.addsubcategory(req.body).then(() => {
      res.render('admin/sub-category', { admin: true })
    })

  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/add-category', adminlog, upload.single('images'), function (req, res, next) {

  try {
    if (req.session.adminLogin) {
      res.render('admin/add-category', { admin: true })
    }

  }
  catch (error) {
    res.render('admin/400')
  }
})


router.post('/add-category', adminlog, upload.array('images'), function (req, res, next) {

  try {
    adminhelpers.addcategory(req.body).then(() => {
      res.redirect('/admin/all-category')
    })

  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/add-subcategory', adminlog, function (req, res, next) {

  try {
    if (req.session.adminLogin) {
      res.render('admin/add-subcategory', { admin: true })
    }

  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/brands', adminlog, async (req, res, next) => {

  try {
    if (req.session.adminLogin) {
      let brands = await adminhelpers.getallbrands()
      res.render('admin/brands', { admin: true, brands })
    }

  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/add-brand', adminlog, function (req, res, next) {


  try {
    if (req.session.adminLogin) {
      res.render('admin/add-brand', { admin: true })
    }

  }
  catch (error) {
    res.render('admin/400')
  }
})


router.post('/add-brand', function (req, res, next) {

  try {
    adminhelpers.addbrand(req.body).then(() => {
      res.redirect('/admin/brands')
    })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/delete-sub/:id', adminlog, function (req, res, next) {

  try {
    adminhelpers.deletesub(req.params.id).then(() => {
      res.render('admin/sub-category', { admin: true })
    })

  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/show-orders', adminlog, async (req, res, next) => {
  try {
    if (req.session.adminLogin) {

      let orderstatus = await adminhelpers.getorderstatus()

      let orders = await adminhelpers.getorderlist()

      res.render('admin/show-orders', { admin: true, orders, orderstatus })
    }

  }
  catch (error) {
    res.render('admin/400')
  }
})


// router.get('/show-orders/:pageno', adminlog, async (req, res, next) => {
//   try {
//     if (req.session.adminLogin) {

//       let orderstatus = await adminhelpers.getorderstatus()

//       let orders = await adminhelpers.getorderlist()

//       res.render('admin/show-orders', { admin: true, orders, orderstatus })
//     }

//   }
//   catch (error) {
//     res.render('admin/400')
//   }
// })


router.get('/product/:id', adminlog, async (req, res, next) => {
  try {
    let orders = await adminhelpers.product(req.params.id)
    res.render('admin/product', { admin: true, orders })

  }
  catch (error) {
    res.render('admin/400')
  }
})

router.get('/delete-orderproduct', adminlog, async (req, res, next) => {

  try {
    adminhelpers.deleteorderProduct(req.body.order, req.body.product).then((response) => {
      //ajax
      userHelpers.stockincriment(req.body.order).then(() => {
        res.json(response)
      })
    })
    res.render('admin/product', { admin: true, orders })

  }
  catch (error) {
    res.render('admin/400')
  }
})



router.get('/edit-subcategory/:id', adminlog, async (req, res, next) => {
  try {
    console.log('ggsjjsbjxbhasbbssbhbshsbahbascbsbsbkas');
    let subcategorylist = await adminhelpers.getsubcategorylist(req.params.id)
    console.log('sssssss');
    console.log(subcategorylist);
    res.render('admin/edit-subcategory', { admin: true, subcategorylist })
  }
  catch (error) {
    res.render('admin/400')
  }
})

router.post('/edit-subcategorydata/:id', async (req, res, next) => {
  try {
    console.log('ggsjjsbjxbhasbbssbhbshsbahbascbsbsbkas');
    console.log(req.params.id);
    console.log('req.params.iddddddddd');
    if (req.session.adminLogin) {
      adminhelpers.editsubcategorydata(req.params.id, req.body).then(() => {
        res.redirect('/admin/sub-category')
      })
    }

  }
  catch (error) {
    res.render('admin/400')
  }
})

router.get('/edit-category/:id', adminlog, async (req, res, next) => {
  try {
    let categorylist = await adminhelpers.getcategorylist(req.params.id)
    console.log('sssssss');
    console.log(categorylist);
    res.render('admin/edit-category', { admin: true, categorylist })

  }
  catch (error) {
    res.render('admin/400')
  }

})

router.post('/edit-categorydata/:id', async (req, res, next) => {

  try {
    console.log('ggsjjsbjxbhasbbssbhbshsbahbascbsbsbkas');
    console.log(req.params.id);
    console.log('req.params.iddddddddd');
    if (req.session.adminLogin) {
      adminhelpers.editcategorydata(req.params.id, req.body).then(() => {
        res.redirect('/admin/all-category')
      })
    }

  }
  catch (error) {
    res.render('admin/400')
  }
})

router.get('/edit-brand/:id', adminlog, async (req, res, next) => {
  try {
    let brandlist = await adminhelpers.getbrandlist(req.params.id)
    console.log('sssssss');
    res.render('admin/edit-brand', { admin: true, brandlist })

  }
  catch (error) {
    res.render('admin/400')
  }

})

router.post('/edit-branddata/:id', async (req, res, next) => {

  try {
    if (req.session.adminLogin) {
      adminhelpers.editbranddata(req.params.id, req.body).then(() => {
        res.redirect('/admin/brands')
      })
    }
  }
  catch (error) {
    res.render('admin/400')
  }
})

router.get('/add-banner', adminlog, function (req, res, next) {

  try {
    res.render('admin/add-banner', { admin: true })
  }
  catch (error) {
    res.render('admin/400')
  }
})

router.post('/add-banner', function (req, res, next) {
  try {
    adminhelpers.addbanner(req.body).then(() => {
      res.redirect('/admin/add-banner')
    })
  }
  catch (error) {
    res.render('admin/400')
  }
})

router.get('/show-banners', adminlog, async (req, res, next) => {
  try {
    let banners = await adminhelpers.getbanners()
    res.render('admin/show-banners', { admin: true, banners })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/edit-banner/:id', adminlog, async (req, res, next) => {
  try {
    let banners = await adminhelpers.editbanner(req.params.id)
    res.render('admin/edit-banner', { admin: true, banners })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/delete-banner/:id', adminlog, async (req, res, next) => {
  try {
    await adminhelpers.deletebanner(req.params.id).then((response) => {
      res.redirect('/admin/show-banners')
    })
  }
  catch (error) {
    res.render('admin/400')
  }
})

router.get('/add-coupen', adminlog, function (req, res, next) {
  try {
    res.render('admin/add-coupen', { admin: true })
  }
  catch (error) {
    res.render('admin/400')
  }
})

router.post('/add-coupen', function (req, res, next) {
  try {
    adminhelpers.addcoupen(req.body).then(() => {
      res.redirect('/admin/add-coupen')
    })
  }
  catch (error) {
    res.render('admin/400')
  }
})

router.get('/show-coupens', adminlog, async (req, res, next) => {
  try {
    let coupens = await adminhelpers.getcoupens()
    res.render('admin/show-coupen', { admin: true, coupens })
  }
  catch (error) {
    res.render('admin/400')
  }
})

router.get('/delete-coupen/:id', adminlog, async (req, res, next) => {
  try {
    await adminhelpers.deletecoupen(req.params.id).then((response) => {
      res.redirect('/admin/show-coupens')
    })

  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/add-offer', adminlog, function (req, res, next) {
  try {
    res.render('admin/add-offer', { admin: true })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.post('/add-offer', function (req, res, next) {
  try {
    adminhelpers.addoffer(req.body).then(() => {
      res.redirect('/admin/add-offer')
    })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/show-offers', adminlog, async (req, res, next) => {
  try {
    let offers = await adminhelpers.getcategory()
    let categoryoffer = await adminhelpers.showoffers()
    res.render('admin/show-offers', { admin: true, offers, categoryoffer })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/show-offer', adminlog, async (req, res, next) => {
  try {
    let categoryoffer = await adminhelpers.showoffers()
    res.render('admin/show-offer', { admin: true, categoryoffer })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/deleteoffer/:id', adminlog, async (req, res, next) => {
  try {
    adminhelpers.deleteoffer(req.params.id).then(() => {
      res.redirect('/admin/show-offer')
    })
  }
  catch (error) {
    res.render('admin/400')
  }
})



router.post('/categoryoffer', function (req, res, next) {
  try {
    console.log(req.body);
    console.log('req.body ccccccccccc');
    adminhelpers.categoryoffer(req.body).then((response) => {
      res.json(response)
    })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.post('/deletecategoryoffer', function (req, res, next) {
  try {
    console.log(req.body);
    console.log('req.body ccccccccccc');
    adminhelpers.deletecategoryoffer(req.body).then((response) => {
      res.json(response)
    })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/add-orderstatus', adminlog, function (req, res, next) {
  try {
    res.render('admin/add-orderstatus', { admin: true })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.post('/add-orderstatus', function (req, res, next) {
  try {
    console.log(req.body);
    console.log('req.body ccccccccccc');
    adminhelpers.orderstatus(req.body).then((response) => {
      res.redirect('/admin/add-orderstatus')
    })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.post('/orderstatus', function (req, res, next) {
  try {
    console.log(req.body);
    console.log('req.bodyfffffffffffffffffffff');
    adminhelpers.orderstatuschange(req.body).then((response) => {
      res.json(response)
    })
  }
  catch (error) {
    res.render('admin/400')
  }
})
var datasort = {};

router.get('/salesreport', adminlog, async (req, res, next) => {
  try {
    console.log(datasort);
    console.log('datasort');
    var orderdata = await adminhelpers.getallorderdetailsreport()
    var weekamount = await adminhelpers.getweeklysaleamount()
    var yearamount = await adminhelpers.getyearsaleamount()
    var monthamount = await adminhelpers.getmonthsaleamount()
    var dayamount = await adminhelpers.getdaysaleamount()
    datasort.orderdata = orderdata;
    console.log(datasort.body);
    console.log('datasort.dataaaaaaaaa');
    res.render('admin/salesreport', { admin: true, orderdata, datasort, weekamount, yearamount, monthamount, dayamount })
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.post('/salesreport-data-date', async (req, res, next) => {
  try {
    var data = await adminhelpers.getsalesreprtdata(req.body)
    var salereportamount = await adminhelpers.getsaleamount(req.body)
    datasort.data = data;
    datasort.body=req.body;

    datasort.salereportamount = salereportamount;
    res.redirect('/admin/salesreport')
  }
  catch (error) {
    res.render('admin/400')
  }
})


router.get('/add-futuerproduct',async(req,res,next)=>{
  console.log('ghjhghjghjhghjhh');
  let getbrands = await adminhelpers.getallbrands()

  res.render('admin/add-futuerproduct',{admin:true,getbrands})

})


router.post('/add-futureproduct', upload.array('images'), (req, res) => {

  try {

    var filenames = req.files.map(function (file) {
      return file.filename;
    });
    req.body.images = filenames;
    producthelpers.addfutureproduct(req.body).then(() => {
      res.redirect('/admin/show-product')
    })


  }
  catch (error) {
    res.render('admin/400')
  }



})


router.get('/show-fproduct',async(req,res,next)=>{
 var fproducts=await adminhelpers.getfproducts()
 
 console.log(fproducts);
 console.log('fproducts');

    res.render('admin/show-fproducts',{admin:true,fproducts})

})


router.get('/delete-fproduct/:id', adminlog, (req, res) => {

  try {
    if (req.session.adminLogin) {
      let proId = req.params.id
      productHelpers.deletefProduct(proId).then(() => {
        res.redirect('/admin/show-fproducts')
      })
    }

  }
  catch (error) {
    res.render('admin/400')
  }

})



















module.exports = router;
