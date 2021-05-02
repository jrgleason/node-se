import Koa from 'koa';
import mount from 'koa-mount';
import {SolarApp} from './solar.mjs';
import {Authentication} from "./authentication.mjs";
import serve from 'koa-static';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import KeyGrip from 'keygrip';
import Pug from 'koa-pug';
import path from 'path';
import cors from "@koa/cors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.SOLAR_PORT || 3000;

const mainApp = new Koa();
const solarApp = new SolarApp();
const auth = new Authentication();
const secret = process.env.SITE_SECRET;
const pug = new Pug({
    viewPath: path.resolve(__dirname, './views'),
    app: mainApp // Binding `ctx.render()`, equals to pug.use(app)
})



if(!secret){
    console.log(`You must declare a SITE_SECRET Environment variable ${secret}`)
    process.exit(-1);
}
mainApp.keys = new KeyGrip([secret], 'sha256');
mainApp.use(cors());
mainApp.use(auth.checkToken.bind(auth));
mainApp.use(mount('/', async (ctx, next)=>{
    if (ctx.path === '/'){
        let userInfo = await auth.getUserInfo(ctx);
        ctx.body = await pug.render('index', {
            user: userInfo
        }, true);
    }
    await next();
}));
mainApp.use(mount('/solar', solarApp.app));
mainApp.use(mount('/auth', auth.app));
mainApp.use(mount('/static', serve(__dirname+"/static")));
mainApp.listen(port, ()=>{
    console.log(`The application is started on ${port}`);
});