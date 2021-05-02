import {ShadowElement} from '/static/ShadowElement.mjs';
class AppBar extends ShadowElement{
    constructor() {
        super();
    }

    async getHtml() {
        return `
          <div class="header">
            <div class="right-side">
            &nbsp;
            </div>
            <div class="middle">
              <slot name="title" class="title-slot"></slot>
            </div>
            <div class="left-side">
              <slot name="image" class="image-slot"></slot>
            </div>
          </div>
          
          <style>
            .header{
              height: 72px;
              width: 100%;
              display: flex;
              background-color: blue;
              justify-content: flex-end;
              margin-right: 10px;
              align-items: center;
              font-size: 14px;
            }
            .header>*{
              flex:1;
            }
            .title-slot{
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .left-side{
              display: flex;
              justify-content: flex-end;
              align-items: center;
            }
            .image-slot{
              color: white;
            }
            ::slotted([slot=image]){
              margin-right: 30px;
            }
          </style>
        `
    }
}
ShadowElement.createElement("solar-app-bar", AppBar);
export {AppBar}
