import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ShorttpdConfig from '../../util/confReader.js';
import urlencoder from 'urlencode';

import { authorize } from './auth.js';

const router = express.Router();
const configReader = new ShorttpdConfig();
/** Router
 * Authorization
 */
router.post('/register', async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
    console.log(`[[Connect Authorization - ${ip}]]:: ${req.originalUrl} ${new Date().toLocaleString()}`);

    if(configReader.config.data.auth.use_auth === 'yes'){
        
        console.log(req.body);

        const authResult = await authorize(req.body.name, req.body.password);
        console.log(authResult);

        return res.status(200).json({
            code: 200,
            message: "Implementing.."
        });
        /* Add more authorization */
    }

    return res.status(200).json({
        code: 200,
        message: "Server is not using authorization feature. Free pass!"
    });
});

router.post('/login', async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
    console.log(`[[Connect Authorization - ${ip}]]:: ${req.originalUrl} ${new Date().toLocaleString()}`);

    if(configReader.config.data.auth.use_auth === 'yes'){
        const authResult = await authorize(req.body.name, req.body.password);
        console.log('/auth/login auth result?', authResult);


        if(authResult){
            return res.status(200).json({
                code: 200,
                message: `Hello, ${req.body.name} !`
            });
        }

        return res.status(401).json({
            code: 401,
            message: "Unauthorized"
        });
        /* Add more authorization */
    }

    return res.status(200).json({
        code: 200,
        message: "Server is not using authorization feature. Free pass!"
    });
});

export default router;