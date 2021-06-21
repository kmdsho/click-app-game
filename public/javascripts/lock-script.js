setInterval(start => {
    let dates = "";
    let remainTime = locktime - (new Date().getTime() - start);     //解除までの時間

    if(remainTime < 0){
        window.location.href = pathname;    //解除
    }

    let remainDate = new Date(remainTime);
    let days = parseInt(remainTime / (1000 * 60 * 60 * 24));    //残り日数
    let hour = remainDate.getUTCHours();
    let min = remainDate.getUTCMinutes();
    let sec = remainDate.getUTCSeconds();

    if(days > 0){
        dates += days + "日 ";
    }

    dates += hour + ":" + ("0" + min).slice(-2) + ":" + ("0" + sec).slice(-2);
    document.getElementById("unlock").innerHTML = dates;
}, 100, new Date().getTime());