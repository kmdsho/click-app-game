//スマホでのスクロールを禁止する
document.addEventListener("touchmove", e => {
    e.preventDefault()
}, { passive: false });