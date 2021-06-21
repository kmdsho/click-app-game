const LOOP = 20;  //数字ボタンの出現回数

let passSecID;
let moveTimer;
let count;
let num;
let cdiv;
let selectLevel;
let time;

//ユーザ名クリックでメニュー表示
function menu(sw){
    const li = document.querySelectorAll("ul li");
    for(let value of li){
        let liStyle = window.getComputedStyle(value);
        value.style.display = liStyle.display;
        if(sw){
            if(value.style.display === "none"){
                value.style.display = "block";
            }else{
                value.style.display = "none";
            }
        }else{
            if(value.style.display === "block"){
                value.style.display = "none";
            }
        }
    }
}

//画面内消去
function clear(){
    while(cdiv.firstChild){
        cdiv.removeChild(cdiv.firstChild);
    }
}

//カウントダウン
function countDown(){
    let count = 3;

    const p = document.createElement("p");
    cdiv.appendChild(p);
    p.id = "count-down";
    p.innerHTML = count;

    return new Promise((resolve, reject) => {
        const countTimer = setInterval(() => {
            count--;
            if(count > 0){
                p.innerHTML = count;
            }else{
                p.innerHTML = "START";
                setTimeout(() => {
                    clearInterval(countTimer);
                    cdiv.removeChild(p);
                    resolve();
                }, 750);
            }
        }, 1000);
    });
}

//起動画面
function start(){
    //タイトル
    const titleText = document.createElement("h1");
    const titleContent = document.createTextNode("Simple Game");
    titleText.appendChild(titleContent);
    titleText.id = "title";
    cdiv.appendChild(titleText);

    //スタートボタン
    const startButton = document.createElement("button");
    const startContent = document.createTextNode("START");
    startButton.appendChild(startContent);
    startButton.id = "start";
    cdiv.appendChild(startButton);

    //難易度選択(ラジオボタン)
    const levelText = document.createElement("p");
    const levelContent = document.createTextNode("-LEVEL-");
    levelText.appendChild(levelContent);
    levelText.id = "level";
    cdiv.appendChild(levelText);
    const levelDiv = document.createElement("div");
    levelDiv.id = "level-div";
    cdiv.appendChild(levelDiv);

      //難易度：難しい
    const hardDiv = document.createElement("div");
    levelDiv.appendChild(hardDiv);
    const hardRadio = document.createElement("input");
    const hardAtt = {
        type: "radio",
        name: "select",
        value: "hard",
        id: "hard"
    }
    for(let i in hardAtt){
        hardRadio[i] = hardAtt[i];
    }
    hardDiv.appendChild(hardRadio);
    const hardLabel = document.createElement("label");
    const hardText = document.createTextNode("Hard");
    hardLabel.appendChild(hardText);
    hardLabel.htmlFor = "hard";
    hardDiv.appendChild(hardLabel);

      //難易度：普通
    const normalDiv = document.createElement("div");
    levelDiv.appendChild(normalDiv);
    const normalRadio = document.createElement("input");
    const normalAtt = {
        type: "radio",
        name: "select",
        value: "normal",
        id: "normal"
    }
    for(let i in normalAtt){
        normalRadio[i] = normalAtt[i];
    }
    normalDiv.appendChild(normalRadio);
    const normalLabel = document.createElement("label");
    const normalText = document.createTextNode("Normal");
    normalLabel.appendChild(normalText);
    normalLabel.htmlFor = "normal";
    normalDiv.appendChild(normalLabel);

      //難易度：易しい
    const easyDiv = document.createElement("div");
    levelDiv.appendChild(easyDiv);
    const easyRadio = document.createElement("input");
    const easyAtt = {
        type: "radio",
        name: "select",
        value: "easy",
        id: "easy",
        checked: "checked"
    }
    for(let i in easyAtt){
        easyRadio[i] = easyAtt[i];
    }
    easyDiv.appendChild(easyRadio);
    const easyLabel = document.createElement("label");
    const easyText = document.createTextNode("Easy");
    easyLabel.appendChild(easyText);
    easyLabel.htmlFor = "easy";
    easyDiv.appendChild(easyLabel);
}

//タイマー処理
function showPassage(start){
    const watch = document.getElementById("wat-style");
    let passSec = Math.round((new Date().getTime() - start) / 10);  //スタートからの経過時間

    let msec = passSec % 100; //十ミリ秒
    let sec = parseInt(passSec / 100) % 60;  //秒
    let min = parseInt(passSec / 6000);  //分

    if(sec <= 9){
        sec = "0" + sec;
    }
    if(msec <= 9){
        msec = "0" + msec;
    }
    if(min >= 10){
        //id=wat-styleにleft:395pxを設定
        const watLayout = window.getComputedStyle(watch);
        watch.style.left = watLayout.left;
        watch.style.left = 395 + "px";
    }
    if(min >= 60){
        //制限時間は60分
        clearInterval(moveTimer);
        clearInterval(passSecID);
        clear();
        end();
    }else{
        watch.innerHTML = min + "：" + sec;
        count = String(min) + sec + "." + msec;
    }
}

//数字ボタンの位置決定
function move(){
    let x, y;
    
    do{
        x = Math.random();  //左上隅画素の中心を原点(0,0)とした時の、右方向へ正のX座標を決める乱数
        y = Math.random();  //左上隅画素の中心を原点(0,0)とした時の、下方向へ正のY座標を決める乱数
    }while((x * 429 > 352 && y * 324 > 287) || (x * 429 > 356 && y * 324 < 30));  //終了ボタンやタイマーと重なったらやり直し

    //id=num-butにleft=x*429px,top=y*324pxを設定
    const numberBut = document.getElementById("num-but");
    const numStyle = window.getComputedStyle(numberBut);
    numberBut.style.left = numStyle.left;
    numberBut.style.top = numStyle.top;
    numberBut.style.left = x * 429 + "px";
    numberBut.style.top = y * 324 + "px";
}

//終了画面
function end(){
    //主にデータベースに格納するためのPOST送信
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/result";
    form.innerHTML = "<input required type=\"hidden\" name=\"score\" value=" + num + ">" +
                    "<input required type=\"hidden\" name=\"time\" value=" + time + ">" +
                    "<input required type=\"hidden\" name=\"level\" value=" + selectLevel + ">" +
                    "<input required type=\"hidden\" name=\"loop\" value=" + LOOP + ">";

    document.body.insertBefore(form, document.getElementsByTagName("script")[0]);  //scriptタグの前にformタグを挿入(実際は見えない)
    form.submit(); //送信
}

window.addEventListener("DOMContentLoaded", function(){
    cdiv = document.getElementById("child-div");
    start();

    document.getElementById("start").addEventListener("click", async function(){
        let first, next;

        const select = document.getElementsByName("select");

        //ラジオボタンで難易度設定
        for(let i = 0; i < select.length; i++){
            if(select[i].checked){
                selectLevel = select[i].value;
                break;
            }
        }

          //hard:難しい, normal:普通, easy:易しい
        switch(selectLevel){
            case "hard":
                first = 700;
                next = 300 / (LOOP - 1);
                break;
            case "normal":
                first = 850;
                next = 250 / (LOOP - 1);
                break;
            case "easy":
                first = 1000;
                next = 200 / (LOOP - 1);
        }

        clear();

        //リターンボタン
        const button = document.createElement("button");
        cdiv.parentNode.appendChild(button);
        button.id = "return";
        button.innerHTML = "Return";
        button.onclick = function(){
            window.location.href = "/";
        }

        await countDown();      //カウントダウンの処理を待つ
        cdiv.parentNode.removeChild(button);

        //タイマー生成
        const watch = document.createElement("p");
        watch.id = "wat-style";
        cdiv.appendChild(watch);
        watch.innerHTML = "0：00";
        time = "000.00";
        passSecID = setInterval(showPassage, 10, new Date().getTime());  //10ミリ秒間隔で回す
            
        //数字ボタンの処理
        const numButton = document.createElement("input");
        numButton.type = "button";
        numButton.value = "01";
        num = 0;
        numButton.id = "num-but";
        cdiv.appendChild(numButton);
        move();
        moveTimer = setInterval(move, first);
        numButton.onclick = function(){
            clearInterval(moveTimer);
            time = count;  //数字ボタンが押されたときのタイムを格納
            if(num < 8){
                numButton.value = "0" + (++num + 1);
            }else{
                numButton.value = ++num + 1;
            }
            move();
            moveTimer = setInterval(move, first - next * num);
            if(numButton.value > LOOP){
                clearInterval(moveTimer);
                clearInterval(passSecID);
                clear();
                end();
            }
        }

        //終了ボタン
        const endButton = document.createElement("button");
        const endContent = document.createTextNode("Give up");
        endButton.appendChild(endContent);
        endButton.id = "give-up";
        cdiv.appendChild(endButton);
        endButton.onclick = function(){
            clearInterval(moveTimer);
            clearInterval(passSecID);
            clear();
            end();
        }
    });

    //ユーザ名をクリックするとメニューを表示、メニュー以外をクリックすると閉じる(ユーザの場合)
    if(parseInt(user)){
        document.getElementById("name_menu").addEventListener("click", function(e){
            menu(1);
            e.stopPropagation();
        });
        document.addEventListener("click", function(){
            menu(0);
        });
    }
});