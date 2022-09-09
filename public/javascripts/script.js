//const { response } = require("../../app")

const e = require("express");


function addToCart(proId) {
    event.preventDefault()
    console.log(proId);
    console.log('proId');
    $.ajax({
        url: '/add-cart/' + proId,
        method: 'get',
        success: (Response) => {
            swal("product added successfully", "success");
            console.log(Response);
            if (Response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)
            }
        }
    })
}



function addTowishlist(proId) {
    event.preventDefault()
    console.log(proId);
    console.log('proId');
    $.ajax({
        url: '/add-wishlist/' + proId,
        method: 'get',
        success: (Response) => {
            swal("product added successfully", "success");
             // if (Response.status) {
            //     let count = $('#cart-count').html()
            //     count = parseInt(count) + 1
            //     $("#cart-count").html(count)
            // }
        }
    })
}

// function changeQuantity(cartId, proId, count) {
//     // event.preventDefault()
//     $.ajax({
//         url: '/change-product-quantity',
//         data: {
//             cart: cartId,
//             product: proId,
//             count: count
//         },
//         method: "POST",
//         success: (response) => {
//             console.log("reached")
//             alert('response')
//             alert(response)
//         }
//     })
// }


$("#coupen-form").submit((e) => {
    console.log('coouppeeeennnnn');
    e.preventDefault(),
    $.ajax({
        url: '/coupen',
        method: 'post',
        data: $('#coupen-form').serialize(),
        success: (response) => {
            console.log(response)
            console.log('response')
            if (response.coupenerr) {
                alert('invalid coupen')
            }
            if (response.discountamount) {
                alert('coupen added successfully')
                document.getElementById('offer-price').innerHTML = response.discountamount
                document.getElementById('total-price').innerHTML = response.grandtotal
            }
        }

    })
})


function checkwallet(total) {
    console.log('shshshhshs')
    console.log(total)
    $.ajax({
        url: '/checkwallet/'+total,
       
        method: 'get',
        success: (response) => {
            if (response.walleterror) {
               let finalamount=total-response.walletamount
               console.log(finalamount);
               let ischecked=$('#defaultCheck1')[0].checked
               if(ischecked){
                document.getElementById('total-price').innerHTML="Rs."+finalamount
               }else{
                document.getElementById('total-price').innerHTML="Rs."+total

               }
            } else {
                alert(response)
                var check=document.getElementById('method').value 
                let ischecked=$('#defaultCheck1')[0].checked
                if(ischecked){
                    document.getElementById('method').style='display:none'
                    document.getElementById('payment_cod').required=false;
                    document.getElementById('payment_razorpay ').required=false;
                    document.getElementById('payment_paypal ').required=false
                }else{
                    document.getElementById('method').style='display:table-row'
                    document.getElementById('payment_cod').required=true;
                    document.getElementById('payment_razorpay ').required=true;
                    document.getElementById('payment_paypal ').required=true

                }
            }

        }
    })
}



// $("#checkout-form").submit((e) => {

//     console.log('asa');
//     e.preventDefault()
//     $.ajax({
//         url: '/place-order',
//         method: 'post',
//         data: $('#checkout-form').serialize(),
//         success: (response) => {
//             console.log(response)
//             console.log('responseddddddddddddddd')
//             alert(response)
//             if (response.codsuccess) {
//                 location.href = '/order-success'

//             }
//             else if (response.razorpay) {
//                 console.log('loggloggloggg')
//                 console.log(response)
//                 razorpayPayment(response)
//                 console.log(response)
//                 console.log('response')


//             }
//             else if (response.paypal) {
//                 console.log('jasoooooonnnnnnnnn')
//                 console.log(response)
//                 for (let i = 0; i < response.links.length; i++) {

//                     if (response.links[i].rel === 'approval_url') {
//                         console.log(response.links[i].href)

//                         location.href = response.links[i].href
//                     }

//                 }
//             }
//         }
//     })
// })

function deletewishlistProduct(cartId, proId) {
    event.preventDefault()
    console.log("delete from wallet");
    console.log(cartId),
    console.log(proId),
    $.ajax({
      
        url: "/delete-wishlistproduct",
        data: {
            wallet: cartId,
            product: proId,
        },
        method: "post",
        success: (response) => {
            if (response.removed) {
                swal("Product Removed From Wishlist");
                location.reload();
            }
        },
    });
}

function deletewishlistProductt(cartId, proId) {
    event.preventDefault()
    console.log("delete from wallet");
    console.log(cartId),
    console.log(proId),
    $.ajax({
      
        url: "/delete-wishlistproductt",
        data: {
            wallet: cartId,
            product: proId,
        },
        method: "post",
        success: (response) => {
            if (response.removed) {
                swal("Product Removed From Wishlist");

                location.reload();
            }
        },
    });
}

