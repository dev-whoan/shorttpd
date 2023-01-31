import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ShorttpdConfig from '../util/confReader.js';
import urlencoder from 'urlencode';

import { authorize } from './auth/auth.js';

/** Variables
 * Router
 */
const router = express.Router();

/** Variables
 * Config Reader
 */
const configReader = new ShorttpdConfig();
const webViewExtensions = configReader.config.data.http.web_view_extension.split(',');
const webViewExclude = configReader.config.data.http.web_view_exclude.split(',');
const cookieName = configReader.config.data.http.web_cookie_name;

console.log(webViewExclude);

/** Variables
 * File Reader
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentPath = path.join(__dirname, '..', 'serve');
const staticHtmlPath = path.join(__dirname, '..', 'html', 'public');

const staticUnitedHTML = path.join(staticHtmlPath, 'view', 'unite.html');
const static404 = path.join(staticHtmlPath, 'view', 'unite_404.html');
const static401 = path.join(staticHtmlPath, 'view', 'unite_401.html');
const staticBodyHTML = path.join(staticHtmlPath, 'fragment', 'body.html');
const STATIC_UNITE_HTML = Buffer.from(fs.readFileSync(staticUnitedHTML)).toString('utf-8');
const STATIC_BODY_HTML = Buffer.from(fs.readFileSync(staticBodyHTML)).toString('utf-8');

router.use('/*', async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
    console.log(`[[Connect - ${ip}]]:: ${req.originalUrl} ${new Date().toLocaleString()}`);
    if(configReader.config.data.auth.use_auth === 'yes'){
        if(!req.headers.cookie){
            return res.render(static401);
        }
        try{
            const authValue = req.headers.cookie.split(`${cookieName}=`)[1];
            if(!authValue){
                return res.render(static401);
            }
            
            const userName = authValue.split(":")[0];
            const userPw = authValue.split(":")[1];
    
            const authResult = await authorize(userName, userPw);
            if(!authResult){
                return res.render(static401);
            }
        } catch (e){
            return res.render(static401);
        }
        /* Add more authorization */
    }
    next();
})

/** Router
 *  Serving Static Files
 */
const createHtmlElement = (item) => {
    let string = '<div class="one-file">'
    if(item.dir)
        string += `<img class="file-type-icon" src="/img/dir.png"/>`
    else
        string += `<img class="file-type-icon" src="/img/file.png"/>`

    string += `<p class="file-name">${item.name}</p>`
    string += `<p class="file-size">${item.size}</p>`
    string += `<p class="file-modified">${item.lastModified ? item.lastModified : ""}</p>`
    string += '</div>';

    return string;
};
router.use('/*', async (req, res, next) => {
    let targeturl = urlencoder.decode(req.originalUrl);

    // 디코딩 후, 기존과 다르면 encode 된 것임
    if(targeturl === req.originalUrl){
        targeturl = req.originalUrl;
    }

    targeturl = targeturl.split(/\ /).join('\ ');

    if(webViewExclude.indexOf(path.basename(targeturl)) !== -1){
        return res.render(static404);
    }
    const extOfFile = path.extname(targeturl);
    const targetPath = req.originalUrl !== '/' ? path.join(currentPath, targeturl) : currentPath;
    const requestPath = targetPath;
    console.log('serve to:', requestPath);
    if(extOfFile ==='.html'){
        return res.render(requestPath);
    }

    try{
        const isDir = fs.lstatSync(requestPath).isDirectory();
        if(isDir){
            try{
                const read = fs.readdirSync(requestPath, { withFileTypes: true });
                const dirs = [];
                const files = [];
                
                read.forEach((file, index) => {
                    if(webViewExclude.indexOf(file.name) !== -1){
                        return false;
                    }
                    const fDir = file.isDirectory();
                    const fName = file.name;
                    const fPath = path.join(requestPath, fName);
                    
                    if(!fDir){
                        const fStat = fs.statSync(fPath);
                        files.push({
                            name: fName,
                            dir: false,
                            size: fStat.size,
                            lastModified: new Date(fStat.mtime).toLocaleString()
                        });
                        return false;
                    }
                    dirs.push({
                        name: fName,
                        dir: true,
                        size: "Directory",
                        lastModified: null
                    });
                });
                
                const fileSorter = (a, b) => {
                    const A = a.name.toUpperCase();
                    const B = b.name.toUpperCase();
                    return ( A > B ) ? 1 : -1;
                }
                dirs.sort(fileSorter);
                files.sort(fileSorter);
    
                const unite = [...dirs, ...files];
    
                let elementString = '';
    
                unite.forEach((oneItem, index) => {
                    let oneElem = createHtmlElement(oneItem);
                    elementString += `<br>${oneElem}`;
                });
                
                const body = STATIC_BODY_HTML.replace('${{ BODY_FILES_HERE }}', elementString);
                const list = STATIC_UNITE_HTML.replace('<div data-include="/shorttpd-static/fragment/body.html"></div>', body);
    
                return res.send(list);
            } catch (e) {
                console.error(`Reading Directory Error -> `, e);
                return res.status(500).json({code: 200, message: "Unable to scan directory..."});
            }
        }

        if(webViewExtensions.indexOf(extOfFile.split('.')[1]) !== -1){
            return res.sendFile(requestPath);
        }
        
        return res.download(requestPath);
        //return res.sendFile(requestPath); -> Open File in Browser
    } catch (e) {
        if(e.message.includes("favicon")){
            return;
        }
        if(e.message.includes('no such file')){
            return res.render(static404);
        }
    }
})

export default router;