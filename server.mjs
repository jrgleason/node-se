import Koa from 'koa';
import mount from 'koa-mount';
import {SolarApp} from './solar.mjs';
import {Authentication} from "./authentication.mjs";
import serve from 'koa-static';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import KeyGrip from 'keygrip'

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.SOLAR_PORT || 3000;

const mainApp = new Koa();
const solarApp = new SolarApp();
const auth = new Authentication();
const secret = process.env.SITE_SECRET;
if(!secret){
    console.log(`You must declare a SITE_SECRET Environment variable ${secret}`)
    process.exit(-1);
}
mainApp.keys = new KeyGrip([secret], 'sha256');
mainApp.use(auth.checkToken.bind(auth));
mainApp.use(mount('/', serve(`${__dirname}/static`)))
mainApp.use(mount('/solar', solarApp.app));
mainApp.use(mount('/auth', auth.app));
mainApp.listen(port, ()=>{
    console.log(`The application is started on ${port}`);
});