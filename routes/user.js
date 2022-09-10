const { ObjectID } = require('bson');
const { Router } = require('express');
var express = require('express');
const session = require('express-session');
const { TaskRouterGrant } = require('twilio/lib/jwt/AccessToken');
const { TrustProductsEntityAssignmentsInstance } = require('twilio/lib/rest/trusthub/v1/trustProducts/trustProductsEntityAssignments');
const { response, render } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
const adminHelper = require('../helpers/admin-helper');
const paypal = require('paypal-rest-sdk')
const CC = require('currency-converter-lt');
const { Db } = require('mongodb');
const { product } = require('../helpers/admin-helper');

/* GET home page. */


const userlog = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }

}





router.get('/', async function (req, res, next) {
  try {

    let cartcount = null;
    if (req.session.user) {
      cartcount = await userHelpers.getcartcount(req.session.user._id)
    
      req.session.cartCount = cartcount
    
    }
    banner=await userHelpers.getbanners()
    fproducts= await userHelpers.getfproducts()

   
    productHelpers.Productslist().then((home) => {
      res.render('user/index', { user: true, home, userlog: req.session.user, cartcount ,banner,fproducts})
    })

  } catch (error) {
    res.render('user/400')

  }
})



router.get('/login', function (req, res, next) {
  try {
    if (req.session.loggedIn) {
      res.redirect('/')
    } else {
      res.render('user/login', { user: true })
    }
  } catch (error) {
    res.render('user/400')
  }
})


router.get('/400', function (req, res, next) {
  res.render('user/400')
})


router.get('/signup', function (req, res, next) {
  try {
    res.render('user/signup', { user: true, signupError: req.session.signupError })
    req.session.signupError = null;

  } catch (error) {
    res.render('user/400')

  }

})


let signupData;
router.post('/signup', function (req, res, next) {
  try {
    req.body.status = true
    signupData = req.body,
      userHelpers.doSignup(req.body).then((response) => {
        console.log(response);
        console.log('response');
        if (response.status) {
          signupData = response;
          res.redirect('/otp')
        } else {
          req.session.signupError = 'Email or mobile already exist'
          res.redirect('/signup')
        }
      })

  } catch (error) {
    res.render('user/400')

  }
})

router.get('/resendotp', function (req, res, next)  {
  try {
      userHelpers.reSendOtp(signupData).then((response) => {
        if (response.status) {
          res.redirect('/otp')
        } else {
          req.session.signupError = 'Email or mobile already exist'
          res.redirect('/signup')
        }
      })

  } catch (error) {
    res.render('user/400')

  }
})


router.get('/otp', function (req, res, next) {
  try {
    res.render('user/otp', { user: true, otperror: req.session.otperror, signupData })
  } catch (error) {
    res.render('user/400')

  }
})


router.post('/submit', function (req, res, next) {
  try {
    userHelpers.otp(req.body, signupData).then((response) => {
      if (response.status) {
        res.redirect('/login')
      } else {
        req.session.otperror = "invalid otp"
        res.redirect('/otp')
      }
    })

  } catch (error) {
    res.render('user/400')
  }
})


router.post('/login', (req, res) => {
  try {
    console.log(req.body);
    userHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.loggedIn = true
        req.session.user = response.user
        res.redirect("/")
      } else {
        req.session.loginerror = true
        res.render('user/login')
      }
    })

  } catch (error) {
    res.render('user/400')

  }
})


router.get('/logout', function (req, res, next) {
  try {
    req.session.destroy()
    res.render('user/index', { user: true })

  } catch (error) {
    res.render('user/400')

  }
})


router.get('/shopmen/:id', async (req, res, next) => {
  try {
    let category = await adminHelper.getcategory()
    let subcategory = await adminHelper.getsubcategory()
    console.log(subcategory);
    productHelpers.productsmen(req.params.id).then(async(productmen) => {

      if(req.session.user){
        var wishpro=await userHelpers.getwishlistproId(req.session.user._id)
      console.log(wishpro);
      console.log('wishpro');
      if(wishpro){
        for(var i=0;i<wishpro[0].products.length;i++){
          for(var j=0;j<productmen.length;j++){
            if(productmen[j]._id.toString() == wishpro[0].products[i].toString()){
              productmen[j].wishlist=true
              break;
            }
          }
        }
      }

      }

      var loginUser
      if (req.session.loggedIn) {
        var userIdd=req.session.user._id

        loginUser = true
      } else {
        loginUser = false
      }
      console.log('loginUser');
      console.log(productmen);
      res.render('user/shopmen', { user: true, loginUser, productmen, userlog: req.session.user, cartcount: req.session.cartCount, category, subcategory,wishpro,userIdd })
    })

  } catch (error) {
    res.render('user/400')

  }
})


router.get('/productview/:id', userlog, function (req, res, next) {
  try {
    productHelpers.productview(req.params.id).then((productview) => {

      res.render('user/productview', { user: true, productview, userlog: req.session.user, cartcount: req.session.cartCount })
    })

  } catch (error) {
    res.render('user/400')

  }
})


router.get('/user/cart', userlog, async (req, res, next) => {
  try {
    if (req.session.user) {
      let products = await userHelpers.getcartproducts(req.session.user._id)
      if (products.carterror) {
        res.render('user/cart', { user: true, products, userlog: req.session.user, cartcount: req.session.cartCount, })

      } else {
        let total = await userHelpers.getTotalAmount(req.session.user._id)
        res.render('user/cart', { user: true, products, userlog: req.session.user, cartcount: req.session.cartCount, total })

      }
    }

  } catch (error) {
    res.render('user/400')

  }
})


router.get('/add-cart/:id', userlog, (req, res, next) => {
  try {
    console.log('req.params.id');
    console.log(req.params.id);
    userHelpers.addtocart(req.params.id, req.session.user._id).then(() => {
      res.json({ staus: true })
    })

  } catch (error) {
    console.log(error);
    res.render('user/400')

  }
})


router.post('/delete-cartproduct', (req, res, next) => {
  try {
    userHelpers.deleteCartProduct(req.body.cart, req.body.product).then((response) => {
      //ajax
      res.json(response)
    })

  } catch (error) {
    res.render('user/400')

  }

})


router.post('/change-product-quantity', (req, res, next) => {
  try {
    console.log(req.body);
    console.log('req.body');
    return new Promise(async (resolve, reject) => {
      if (req.body.count == -1 && req.body.quantity == 1) {
        console.log('ghhjbjkdbkjsbksdjbkj');
        await userHelpers.deleteCartProductt(req.body).then(() => {
          resolve()
        })

      } else {

        userHelpers.changeProductQuantity(req.body).then(async (response) => {
          response.total = await userHelpers.getTotalAmount(req.session.user._id)
          res.json(response)
        })
      }
    })

  } catch (error) {
    res.render('user/400')

  }

}
)





router.get('/place-order', userlog, (async (req, res, next) => {
  try {
    if (req.session.user) {

      console.log('placeeeeee orderrrrr');
      let total = await userHelpers.getTotalAmount(req.session.user._id)
      let address = await userHelpers.showaddress(req.session.user._id)
      let wallet = await userHelpers.getwalletamount(req.session.user._id)
      console.log(wallet);
      console.log('wallet');

      if (req.session.amount) {
        var totals = req.session.amount

      }
      res.render('user/checkout', { user: true, userlog: req.session.user, total, address, totals, wallet })
    } else {
      res.redirect('/login')
    }

  } catch (error) {
    console.log('page eroor');
    console.log(error);

    res.render('user/400')

  }
}))





router.post('/place-order', async (req, res) => {
  try {
    console.log(req.body);
    console.log('req.bodyssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss');

    if (req.session.user) {

      let order = {}
      //  order.paymentmethod=req.body.payment-method
      order.address = await userHelpers.getaddressoder(req.body.address)
      var wallet = await userHelpers.getwalletamount(req.session.user._id)
      var walletamount = wallet[0].walletamount


      var userId = req.session.user._id
      console.log(userId);
      console.log('userIddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd');


      let products = await userHelpers.getCartproductList(req.session.user._id)
      var totalPrice = await userHelpers.getTotalAmount(req.session.user._id)
      console.log('totaaaaaaaaallllllll');
      console.log(totalPrice);
      userHelpers.placeOrder(req.body, order, products, totalPrice).then(async (orderId) => {
        var orderIdd = orderId

        if (req.body['payment-method'] == 'COD') {
          userHelpers.stockdecriment(products)

          console.log('shshshshshhsss');


          if (req.session.balanceamount) {
            totalPrice = req.session.balanceamount
            walletamount = req.session.walletamount
            userId = req.session.user._id

            userHelpers.wallethistoryadd(orderIdd, walletamount, totalPrice, userId).then(() => {

            })


          }





          res.json({ codsuccess: true })
        } else if (req.body['payment-method'] == 'Razorpay') {
          var data = req.body['payment-method']
          console.log('shshshshshhsss');




          if (req.session.amount) {
            totalPrice = req.session.amount.grandtotal
          }



          else if (req.session.balanceamount) {
            totalPrice = req.session.balanceamount
            walletamount = req.session.walletamount
            userId = req.session.user._id

            userHelpers.wallethistoryadd(orderIdd, walletamount, totalPrice, userId).then(() => {

            })


          }




          userHelpers.stockdecriment(products)

          userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
            console.log(response);
            console.log('response');
            response.Razorpay = true
            res.json(response)
          })
        }

        else if (req.body['payment-method'] == 'paypal') {
          if (req.session.user) {
            userHelpers.converter(totalPrice).then((response) => {
              console.log(totalPrice);
              console.log('totalPrice');

              if (req.session.balanceamount) {
                totalPrice = req.session.balanceamount
                totalPrice = req.session.balanceamount
                walletamount = req.session.walletamount
                userId = req.session.user._id

                userHelpers.wallethistoryadd(orderIdd, walletamount, totalPrice, userId).then(() => {

                })
              }

              userHelpers.generatepaypal(orderId, totalPrice).then((response) => {
                userHelpers.changePaymentStatus(orderId).then(() => {

                })

                response.paypal = true
                res.json(response)
                userHelpers.deleteordercartproduct(req.session.user._id).then(() => {
                  resolve()
                })

              })

            })
          }

        }

        else if (req.body['payment-method-w'] == 'wallet') {
          if (req.session.user) {
            if (walletamount > totalPrice) {
              userHelpers.stockdecriment(products)
              userHelpers.changePaymentStatus(orderId).then(() => {
                let finalwallet = walletamount - totalPrice

                userHelpers.changewalletamount(req.session.user._id, finalwallet).then(() => {

                  userId = req.session.user._id
                  walletamount = totalPrice
                  totalPrice = 0

                  userHelpers.wallethistoryadd(orderIdd, walletamount, totalPrice, userId).then(() => {

                  })

                })
              }
              )
              res.json({ codsuccess: true })
              userHelpers.deleteordercartproduct(req.session.user._id).then(() => {
                resolve()
              })
            } else {
              res.json({ codsuccess: false })
              userHelpers.changewalletamount(req.session.user._id, 0).then(() => {


              })
            }

          }

        }

      })

    }


  } catch (error) {
    console.log('errooorrrrrr22222');
    console.log(error);
    res.render('user/400')

  }


})


router.get('/order-success', async (req, res, next) => {
  try {
    console.log('shshshshshshshsshshshshhshsshshhshshhshshs');
    await userHelpers.deleteorderpending().then(() => {

    })
    res.render('user/order-success', { user: true, userlog: req.session.user })

  } catch (error) {
    res.render('user/400')
  }
})


router.get('/view-order', userlog, async (req, res, next) => {
  try {
    if (req.session.user) {

      let orders = await userHelpers.getorderlist(req.session.user._id)
      console.log(orders);
      console.log('orderss');
      res.render('user/view-order', { user: true, userlog: req.session.user, orders })
    }

  } catch (error) {
    res.render('user/400')
  }
})


router.post('/verify-payment', (req, res, next) => {
  try {

    if (req.session.user) {
      console.log(req.body);
      console.log('req.bodyyyyyyyyyyyyyyy');
      userHelpers.verifyPayment(req.body).then(() => {
        userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
          res.json({ status: true })

          userHelpers.deleteordercartproduct(req.session.user._id).then(() => {
            resolve()
          })

        })
      }).catch((err) => {
        res.json({ status: false, errMsg: "transaction failed" })
      })

    }

  } catch (error) {
    res.render('user/400')
  }
})


router.post('/delete-orderproduct', (req, res, next) => {
  try {

    if (req.session.user) {
      console.log(req.body.order);
      console.log('req.body.order');
      console.log(req.body.product);
      console.log('req.body.product');
      userHelpers.deleteorderProduct(req.body.order, req.body.product, req.session.user._id).then((response) => {
        console.log(response);
        console.log('llllllllllllllllllllllllllllllllllllllllresponse');

        userHelpers.stockincriment(req.body.order).then(() => {
          res.json(response)
        })
      })
    }
  } catch (error) {
    res.render('user/400')

  }
})


router.get('/show-orderslist/:id', userlog, async (req, res, next) => {
  try {
    var id = req.params.id
    console.log(id);
    console.log('id');
    let orders = await userHelpers.showorderslist(req.params.id)
    console.log('ordersss');
    console.log(orders);
    res.render('user/show-orderslist', { user: true, userlog: req.session.user, orders, id })

  } catch (error) {
    res.render('user/400')

  }

})


router.get('/profile', userlog, async (req, res, next) => {
  try {
    if (req.session.user) {
      let wallet = await userHelpers.getwalletamount(req.session.user._id)
      res.render('user/profile', { user: true, userlog: req.session.user, wallet })

    }

  } catch (error) {
    res.render('user/400')

  }
}
)


router.get('/address', userlog, (req, res, next) => {
  try {

    if (req.session.user) {
      userHelpers.showaddress(req.session.user._id).then((address) => {
        res.render('user/address', { user: true, userlog: req.session.user, address })
      })
    }
  } catch (error) {
    res.render('user/400')

  }
})



router.get('/add-address', userlog, function (req, res, next) {
  try {
    res.render('user/add-address', { user: true, userlog: req.session.user })

  } catch (error) {
    res.render('user/400')

  }
}
)

router.post('/add-address', function (req, res, next) {
  try {
    userHelpers.addaddress(req.body).then(() => {
      res.redirect('/address')
    })

  } catch (error) {
    res.render('user/400')

  }
}
)



router.get('/deleteaddress/:id', userlog, function (req, res, next) {
  try {
    console.log('sheroooooqqqqqq')
    userHelpers.deleteaddress(req.params.id).then(() => {
      res.redirect('/address')
    })
  } catch (error) {
    res.render('user/400')

  }
}
)


router.get('/editProfile/:id', userlog, (async (req, res, next) => {
  try {
    let address = await userHelpers.editaddress(req.params.id)

    res.render('user/editprofile', { user: true, userlog: req.session.user, address })

  } catch (error) {
    res.render('user/400')

  }
})
)


router.post('/editprofiledata/:id', function (req, res, next) {
  try {
    userHelpers.editprofiledata(req.params.id, req.body).then(() => {
      res.redirect('/profile')
    })

  } catch (error) {
    res.render('user/400')

  }
}
)


router.get('/menssandels/:catid/:subid', userlog, (async (req, res, next) => {
  try {
    console.log(req.params.catid);
    console.log('req.params.catid');
    console.log(req.params.subid);
    let category = await adminHelper.getcategory()
    let subcategory = await adminHelper.getsubcategory()
    let productmen = await productHelpers.menssandels(req.params.catid, req.params.subid)

    if(req.session.user){
      var wishpro=await userHelpers.getwishlistproId(req.session.user._id)
    console.log(wishpro);
    console.log('wishpro');
    if(wishpro){
      for(var i=0;i<wishpro[0].products.length;i++){
        for(var j=0;j<productmen.length;j++){
          if(productmen[j]._id.toString() == wishpro[0].products[i].toString()){
            productmen[j].wishlist=true
            break;
          }
        }
      }
    }

    }

    res.render('user/shopmen', { user: true, productmen, userlog: req.session.user, cartcount: req.session.cartCount, category, subcategory })

  } catch (error) {
    res.render('user/400')

  }
})
)


router.post('/coupen', async (req, res) => {
  try {
    console.log(req.body);
    if (req.session.user) {

      let total = await userHelpers.getTotalAmount(req.session.user._id)
      console.log('total');
      console.log(total);
      userHelpers.coupencheck(req.session.user._id, req.body, total).then((response) => {
        if (response.coupen) {
          let amount = {}
          let coupen = response.coupenn
          console.log('coupen');
          console.log(coupen);
          amount.discountamount = (coupen.Percentage * total) / 100
          amount.grandtotal = total - amount.discountamount

          req.session.amount = amount
          console.log('amount');
          console.log(amount);
          res.json(amount)
        } else {
          let responses = {}
          responses.coupenerr = true
          console.log('req.session.amount');
          res.json(responses)
        }
      })
    }

  } catch (error) {
    res.render('user/400')

  }
})

router.post('/add-addresscheckout', function (req, res, next) {
  try {
    userHelpers.addaddress(req.body).then(() => {
      res.redirect('/place-order')
    })

  } catch (error) {
    res.render('user/400')

  }
}
)


router.get('/changepassword', userlog, (function (req, res, next) {
  try {
    res.render('user/change-password', { user: true, userlog: req.session.user })
  } catch (error) {
    res.render('user/400')

  }
})
)


router.post('/change-password', function (req, res, next) {
  try {

    console.log(req.body);
    console.log('req.body');
    userHelpers.changepassword(req.body).then(() => {
      res.redirect('/profile')
    })
  } catch (error) {
    res.render('user/400')

  }
}
)

router.get('/success', userlog, function (req, res, next) {
  try {

    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
        "amount": {
          "currency": "USD",
          "total": "25.00"
        }
      }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        console.log(JSON.stringify(payment));
        res.send('Success');
      }
    });

  } catch (error) {
    res.render('user/400')

  }
})


router.get('/checkwallet/:total', userlog, function (req, res, next) {
  try {
    console.log(req.params.total);
    console.log('req.params.total');

    if (req.session.user) {
      userHelpers.checkwallet(req.session.user._id).then((response) => {
        console.log(req.params.total);
        console.log('req.params.total');
        console.log(response.walletamount);
        if (req.params.total >= parseInt(response.walletamount)) {
         
          response.walleterror = true
          var balanceamount = parseInt(req.params.total) - parseInt(response.walletamount)

          req.session.balanceamount = balanceamount;
          req.session.walletamount = response.walletamount;
          res.json(response)
          userHelpers.changewalletamount(req.session.user._id, 0).then(() => {
          })

        } else {

          res.json(response)
        }

      })
    }


  } catch (error) {
    res.render('user/400')

  }
})


router.get('/invoice/:id/:proid', userlog, async (req, res, next) => {
  try {
    console.log(req.params.id);
    console.log('req.params.id');
    console.log(req.params.proid);
    var proData = await userHelpers.showoinvoice(req.params.id, req.params.proid)
    console.log(proData);
    console.log('proDatafinallll');


    res.render('user/invoice', { user: true, userlog: req.session.user, proData })
  } catch (error) {
    res.render('user/400')

  }
})


router.get('/wallet-history', userlog, (async (req, res, next)=> {
  try {
   var wallet=await userHelpers.getwalletreport(req.session.user._id)
   console.log(wallet);
   console.log('wallettttttttttttttt');
    res.render('user/wallet-history', { user: true, userlog: req.session.user,wallet })
  } catch (error) {
    res.render('user/400')

  }
})
)



router.get('/wishlist',userlog, (async (req, res, next)=> {
  try {
   
   var prolist=await userHelpers.getwishlistpro(req.session.user._id)
   console.log(prolist);
   console.log('prolistttttttttt');
    res.render('user/wishlist', { user: true, userlog: req.session.user,prolist })
  } catch (error) {
    res.render('user/400')

  }
})
)



router.get('/add-wishlist/:id', userlog, (req, res, next) => {
  try {
    console.log('req.params.id');
    console.log(req.params.id);
    userHelpers.addtowishlist(req.params.id, req.session.user._id).then((response) => {
      res.json({ staus: true })
    })

  } catch (error) {
    console.log(error);
    res.render('user/400')

  }
})


router.post('/delete-wishlistproduct', (req, res, next) => {
  try {
    console.log('shshsshshshsshsh');
    console.log(req.body.wallet);
    console.log('req.body.wallet');
    console.log(req.body.product);
    console.log('req.body.product');
    userHelpers.deletewishlistProduct(req.body.wallet, req.body.product).then((response) => {
      //ajax
      res.json(response)
    })

  } catch (error) {
    res.render('user/400')

  }

})


router.post('/delete-wishlistproductt', (req, res, next) => {
  try {
    console.log('shshsshshshsshsh');
    console.log(req.body.wallet);
    console.log('req.body.wallet');
    console.log(req.body.product);
    console.log('req.body.product');
    userHelpers.deletewishlistProductt(req.body.wallet, req.body.product).then((response) => {
      //ajax
      res.json(response)
    })

  } catch (error) {
    res.render('user/400')

  }

})


router.get('/totalinvoice/:id',userlog,function(req,res,next){
  console.log(req.params.id);
  console.log('req.params.id');

  userHelpers.showtotalinvoice(req.params.id).then((orderlist)=>{
    
    res.render('user/totalinvoice',{user:true,orderlist})
  })
})






























module.exports = router;
