const eye = document.getElementById("eye");
const password = document.getElementsByName("password")[0];

eye.addEventListener("click", function(){
    if(eye.src.match(/.*\/images\/eye\.png$/g)){
        eye.src = "../images/eye-off.png";
        password.type = "text";
    }else{
        eye.src = "../images/eye.png";
        password.type = "password";
    }
});