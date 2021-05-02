import {AppBar} from "/static/appbar.mjs";
document.onreadystatechange = function () {
    if (document.readyState === "complete") {
        setTimeout(
            ()=>{
                document.getElementById("jrg-root-element").style.display = "initial";
            }
        );
    }
}