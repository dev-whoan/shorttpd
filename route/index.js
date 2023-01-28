import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ShorttpdConfig from '../util/confReader.js';

/** Variables
 * Router
 */
const router = express.Router();
/** Variables
 * Config Reader
 */
const configReader = new ShorttpdConfig();

/** Variables
 * File Reader
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentPath = path.join(__dirname, '..', 'serve');
const staticHtmlPath = path.join(__dirname, '..', 'html');

const staticUnitedHTML = path.join(staticHtmlPath, 'unite.html');
const static404 = path.join(staticHtmlPath, 'unite_404.html');
const staticBodyHTML = path.join(staticHtmlPath, 'body.html');
const STATIC_UNITE_HTML = Buffer.from(fs.readFileSync(staticUnitedHTML)).toString('utf-8');
const STATIC_BODY_HTML = Buffer.from(fs.readFileSync(staticBodyHTML)).toString('utf-8');

/** Router
 * Authorization
 */
router.use('/*', (req, res, next) => {
    if(configReader.config.data.auth.use_auth === 'yes'){
        if(!req.headers.authorization){
            return res.status(401).json({
                code: 401,
                message: "Unauthorized"
            })
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
        string += `<img class="file-type-icon" src="/shorttpd-static/img/dir.png"/>`
    else
        string += `<img class="file-type-icon" src="/shorttpd-static/img/file.png"/>`

    string += `<p class="file-name">${item.name}</p>`
    string += `<p class="file-size">${item.size}</p>`
    string += `<p class="file-modified">${item.lastModified ? item.lastModified : ""}</p>`
    string += '</div>';

    return string;
};
router.use('/*', async (req, res, next) => {
    const extOfFile = path.extname(req.originalUrl);
    const targetPath = req.originalUrl !== '/' ? path.join(currentPath, req.originalUrl) : currentPath;
    if(extOfFile ==='.html'){
        return res.render(targetPath);
    }

    try{
        const isDir = fs.lstatSync(targetPath).isDirectory();
        if(isDir){
            try{
                const read = fs.readdirSync(targetPath, {withFileTypes: true });
                const dirs = [];
                const files = [];
                
                read.forEach((file, index) => {
                    const fDir = file.isDirectory();
                    const fName = file.name;
                    const fPath = path.join(targetPath, fName);
                    
                    if(!fDir){
                        const fStat = fs.statSync(fPath);
                        files.push({
                            name: fName,
                            dir: false,
                            size: fStat.size,
                            lastModified: fStat.mtime
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
                const list = STATIC_UNITE_HTML.replace('<div data-include="/shorttpd-static/body.html"></div>', body);
    
                return res.send(list);
            } catch (e) {
                console.error(`Reading Directory Error -> `, e);
                return res.status(500).json({code: 200, message: "Unable to scan directory..."});
            }
        }
        
        /*
        res.pipe(filedata);
        filedata.on('finish', () => {
            const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
            console.log(`[[Download ${ip}]]->targetPath`);
            filedata.close();
        });
        */
        return res.download(targetPath);
        //return res.sendFile(targetPath); -> Open File in Browser
    } catch (e) {
        if(e.message.includes('no such file')){
            return res.render(static404);
        }
    }
})

export default router;