import Koa from 'koa';
import https from 'https';

const app = new Koa();
const port = process.env.SOLAR_PORT || 3000;
const apiKey = process.env.SOLAR_API_KEY;
const siteId = process.env.SOLAR_SITE_ID;
const host = process.env.SOLAR_EDGE_HOST || "monitoringapi.solaredge.com";

if(apiKey == null || siteId == null){
    console.error(`You must pass the apiKey and siteId`);
    process.exit(-1);
}

const onRequest = async (ctx)=>{
    return new Promise(((resolve) => {
        https.get({
            host,
            path: `/site/${siteId}/overview?api_key=${apiKey}`
        }, (res)=>{
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            let result="";
            res.on('data', chunk=>{
                result += chunk;;
            });
            res.on('end', ()=>{
                ctx.set('Content-Type', 'application/json');
                ctx.body = result;
                resolve(result)
            })
        })
    }));
}
const onStart = async ()=>{
    console.log(`Listening on port ${port}...`);
}

const run = async () =>{
    app.use(onRequest);
    app.listen(port, onStart)
}
run();