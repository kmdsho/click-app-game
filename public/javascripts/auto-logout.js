let timer;

function logoutEvent(){
    clearInterval(timer);  //リセット
    timer = setTimeout(function(){
        window.location.href = "/logout";
    }, 600000);  //再び10分後にセット
}

//一定時間操作しなかったら自動的にログアウト(ユーザがログインした場合)
function logoutTimer(){
    const body = document.body;
    timer = setTimeout(function(){
        window.location.href = "/logout";
    }, 600000);  //10分後にセット

    //何らかの動作(マウス押下、カーソル移動、キー押下)するたびにタイマーをリセット
    body.addEventListener("mousedown", logoutEvent);
    body.addEventListener("mousemove", logoutEvent);
    body.addEventListener("keydown", logoutEvent);
}

window.addEventListener("DOMContentLoaded", function(){
    //ユーザであればタイマーをセット
    if(parseInt(user)){
        logoutTimer();
    }
});