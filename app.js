import express from 'express';
import defaultRouter from './route/index.js';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentPath = path.join(__dirname, '..', 'serve');

// app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);
app.use('/shorttpd-static', express.static(path.join(__dirname, 'html')));
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.use('/favicon.ico', express.static('./img/favicon.ico'));

app.use('/', defaultRouter);

app.all('*', (req, res) => {
    const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
    console.log(`[[404]] ${ip} requested ${req.originalUrl}`);
    res.status(404).json({
        code: 404,
        message: "Http Not Found"
    });
});

export default app;