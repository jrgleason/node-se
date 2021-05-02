import {ShadowElement} from '/static/ShadowElement.mjs';
import Mustache from 'https://unpkg.com/mustache/mustache.mjs';

class Dashboard extends ShadowElement {
    constructor() {
        super();
    }

    async render(){
        const solar = await this.getSolarInfo();
        this.shadowRoot.innerHTML = await this.getHtml(solar);
    }

    async getHtml(state){
        const str = await this.getHtmlString();
        return Mustache.render(str, state);
    }

    async requestGETString(url){
        return new Promise((res, rej) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onload = ()=>{
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        res(xhr.responseText);
                    } else {
                        rej(xhr.statusText);
                    }
                }
            };
            xhr.onerror = ()=> {
                console.error(xhr.statusText);
                rej(xhr.statusText)
            };
            xhr.send(null);
        })
    }

    async getHtmlString() {
        return await this.requestGETString("/static/dashboard.html");
    }

    async getSolarInfo() {
        const result = await this.requestGETString("/solar");
        return JSON.parse(result);
    }
}

ShadowElement.createElement("solar-dashboard", Dashboard);
export {Dashboard}