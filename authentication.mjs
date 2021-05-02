import Koa from 'koa';
import mount from 'koa-mount';
import https from 'https';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const domain = process.env.AUTH0_DOMAIN;
const clientId = process.env.AUTH0_CLIENT_ID;
const clientSecret = process.env.AUTH0_CLIENT_SECRET;
const audience = process.env.AUTH0_AUDIENCE;
const redirectUrl = process.env.AUTH0_REDIRECT_URL || "http://localhost:3000/auth/callback";
const JWKS_URL = `https:\/\/${domain}/.well-known/jwks.json`;
const siteDomain = process.env.SITE_DOMAIN || "localhost";

if (domain == null || clientId == null || clientSecret == null || audience==null) {
    console.error(`You must pass all Auth0 related values`);
    process.exit(-1);
}

class Authentication{
    whitelist = [
        "/",
        "/auth/login",
        "/auth/callback",
        "/auth/logout",
        "/static/main.mjs",
        "/static/ShadowElement.mjs",
        "/static/appbar.mjs",
        "/static/style.css"
    ];
    constructor() {
        this.redirectApp = new Koa();
        this.redirectApp.use(this.onLogin);
        this.logoutApp = new Koa();
        this.logoutApp.use(this.onLogout);
        this.callbackApp = new Koa();
        this.callbackApp.use(this.onCallback);
        this.app = new Koa();
        this.app.use(mount('/login', this.redirectApp));
        this.app.use(mount('/callback', this.callbackApp));
        this.app.use(mount('/logout', this.logoutApp));
        this.app.use(mount('/user', this.onUserInfo.bind(this)));
    }
    static async getPublicKey(){
        const client = jwksClient({
            jwksUri: JWKS_URL,
            requestHeaders: {}, // Optional
            timeout: 30000 // Defaults to 30s
        });
        const keys = await client.getSigningKeys();
        const key = keys[0];
        return key.getPublicKey();
    }
    verifyToken(ctx){
        return new Promise(async (res, rej)=>{
            const cookie = ctx.cookies.get("userInfo");
            if(cookie == null) return rej("No cookie found"); // Cookie isn't set...
            const userInfo = JSON.parse(cookie);
            if(userInfo.idToken == null || userInfo.accessToken == null){
                ctx.redirect("/auth/login");
                rej({
                    error: "No user information found please login or contact and admin"
                });
                return;
            }
            const key = await Authentication.getPublicKey();
            jwt.verify(
                userInfo.idToken,
                key,
                { algorithms: ['RS256'] },
                (err, val)=>{
                    if(err){
                        Authentication.setUserInfo(ctx);
                        console.error(err);
                        rej(err)
                    } else {
                        res(val)
                    }
                }
            );
        });
    }
    async getUserInfo(ctx){
        const userInfo = await this.verifyToken(ctx);
        return {
            email: userInfo['email_verified'] ? userInfo.email : null,
            name: userInfo.name,
            picture: userInfo.picture,
            given: userInfo['given_name'],
            language: userInfo.locale
        }
    }
    async onUserInfo(ctx){
        ctx.set("Content-Type", "application/json");
        ctx.body = this.getUserInfo(ctx);
        return ctx.body;
    }
    async checkToken(ctx, next){
        if(this.whitelist.indexOf(ctx.path) >= 0){
            const cookie = ctx.cookies.get("userInfo");
            if(cookie != null){
                const userInfo = JSON.parse(cookie);
                try{
                    await this.verifyToken(ctx);
                } catch(ex){
                    // TODO: Do something?
                }
            }
            await next();
        } else{
            const cookie = ctx.cookies.get("userInfo");
            if(cookie == null) ctx.redirect("/auth/login");
            else{
                await this.verifyToken(ctx);
                await next();
            }
        }
    }
    onLogout(ctx){
        const url = `https://${domain}/v2/logout?`+
            `client_id=${clientId}&`+
            `returnTo=${encodeURI("http://localhost:3000")}`;
        Authentication.setUserInfo(ctx,null);
        // ctx.redirect(url);
        ctx.redirect("/");
    }
    onLogin(ctx){
        const path = `https://${domain}/authorize?response_type=code`+
            `&client_id=${clientId}`+
            `&redirect_uri=${redirectUrl}`+
            `&scope=${encodeURI("openid email profile")}&audience=${audience}&state=`;
        ctx.redirect(path);
    }
    static setUserInfo(ctx, val){
        if(val){
            ctx.cookies.set(
                'userInfo',
                val,{
                    signed: true,
                    overwrite: true
                }
            )
        } else{
            ctx.cookies.set('userInfo','',{
                signed: true,
                overwrite: true
            });
        }

    }
    async onCallback(ctx){
        return new Promise((res, rej)=>{
            const code = ctx.request.query.code;
            if(code == null){
                ctx.redirect("/auth/login");
                return;
            }
            const body = `grant_type=authorization_code&client_id=${encodeURI(clientId)}`+
                `&client_secret=${encodeURI(clientSecret)}`+
                `&code=${encodeURI(code)}`+
                `&scope=${encodeURI("openid email profile")}`+
                `&redirect_uri=${encodeURI("http://localhost:3000/auth/callback")}`;
            const options = {
                hostname: domain,
                port: 443,
                path: '/oauth/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(body)
                }
            };
            const req = https.request(options, response=>{
                response.setEncoding('utf8');
                let responseBody = '';
                // Build JSON string from response chunks.
                response.on('data', chunk => responseBody = responseBody + chunk);
                response.on('end', ()=> {
                    const parsedBody = JSON.parse(responseBody + '');
                    if(response.statusCode !== 200){
                        rej(parsedBody);
                    } else{
                        Authentication.setUserInfo(ctx,JSON.stringify({
                            accessToken: parsedBody['access_token'],
                            idToken: parsedBody['id_token']
                        }));
                        ctx.redirect('/');
                        res(parsedBody);
                    }
                });
            })
            req.write(body);
            req.end();
            req.on('error', function (e) { reject(e); });
        })

    }
}

export { Authentication };

