import express from 'express';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

import defaultRouter from './route/index.js';
import authRouter from './route/auth/index.js';
import adminRouter from './route/admin/index.js';
import ShorttpdConfig from './util/confReader.js';
import DBAcceesor from './database/dba.js';

const app = express();

/** Variables
 * Config Reader
 */
const configReader = new ShorttpdConfig();
const adminUri = configReader.config.data.auth.admin_page_prefix;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const staticHtmlPath = path.join(__dirname, 'html', 'public', 'view');
const staticLogin = path.join(staticHtmlPath, 'unite_login.html');

// app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);
app.use(`${adminUri}`, express.static(path.join(__dirname, 'html', 'admin')));
app.use('/img', express.static(path.join(__dirname, 'html', 'img')));
app.use('/js', express.static(path.join(__dirname, 'html', 'js')));
app.use('/shorttpd-static/fragment', express.static(path.join(__dirname, 'html', 'public', 'fragment')));
app.use('/shorttpd-static', express.static(path.join(__dirname, 'html', 'public', 'view')));

app.get("/favicon.ico", (req, res) => res.status(204).end());
app.use('/favicon.ico', express.static('./img/favicon.ico'));

app.use('/login', (req, res, next) => {
    return res.render(staticLogin);
});
app.use('/manage', adminRouter);
app.use('/auth', authRouter);
app.use('/', defaultRouter);

const dba = new DBAcceesor();

app.all('*', (req, res) => {
    const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
    console.log(`[[404]] ${ip} requested ${req.originalUrl}`);
    res.status(404).json({
        code: 404,
        message: "Http Not Found"
    });
});

export default app;