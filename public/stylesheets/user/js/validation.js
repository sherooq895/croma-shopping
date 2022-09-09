
var nameerror = document.getElementById('name-error')
var emailerror = document.getElementById("email-error")
var contacterror = document.getElementById("contact-error")
var messageerror = document.getElementById("message-error")
var submiterror=document.getElementById("contact-submit")
function validatename() {
    var name = document.getElementById("contact-name").value;
    if (name.length == 0) {
        nameerror.innerHTML = "name is required";
        return false;
    }
    if (!name.match(/^[a-zA-Z]*\s{1}[a-zA-Z]*$/)) {
        nameerror.innerHTML = "write full name";
        return false;
    }
    nameerror.innerHTML = "valid";
    return true;

}
function validateemail() {
    var email = document.getElementById("Email").value;
    if (email.length == 0) {

        emailerror.innerHTML = "email is required";
        return false;
    }
    if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
        emailerror.innerHTML = "please enter the valid email"
        return false;
    }
    emailerror.innerHTML = "valid"
    return true;
}
function validatecontact() {
    var contact = document.getElementById("contact-number").value;
    if (contact == 0) {
        contacterror.innerHTML = "contact number is requird"
        return false;
    }
    if (contact.length !== 10) {
        contacterror.innerHTML = "number is  invalid"
        return false;
    }
    if (!contact.match(/^[0-9]{10}$/)) {
        contacterror.innerHTML = "invalid number"
        return fal
    }
    contacterror.innerHTML = "valid"
    return true;

}
function validatemessage(){
    message=document.getElementById('contact-message').value;

    if(message.length==0){
        messageerror.innerHTML="invalid message"
    }

    if(message.length<50){
        messageerror.innerHTML="type  more"
    }
    messageerror.innerHTML="valid"
    return true;
}
function validatesubmit(){
    if(!validatename()||!validateemail()||!validatecontact()||!validatemessage){
        alert("Fill all the data")
        return false;
    }
    alert("Success")
    return true;
}