class ShadowElement extends HTMLElement{
    constructor(mode = 'open') {
        super();
        this.mode = mode;
        this.attachShadow({mode});
        this.render();
    }
    async render(){
        this.shadowRoot.innerHTML = await this.getHtml();
    }
    async getHtml(){
        throw new Exception("Must have an implementation for getHtml!");
    }
    static createElement(name, object, params) {
        customElements.get(name) ||
        customElements.define(name, object, params);
    }
}
export {ShadowElement};
