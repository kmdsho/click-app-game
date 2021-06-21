function getIP(json) {
    const form = document.createElement("form");
    form.method = "post";
    form.action = pathname;

    form.innerHTML = "<input required type=\"hidden\" name=\"ip\" value=" + json.ip + ">";

    document.body.insertBefore(form, document.getElementsByTagName("script")[0]);  //scriptタグの前にformタグを挿入(実際は見えない)
    form.submit(); //送信
}