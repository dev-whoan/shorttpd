import express from 'express';
import ShorttpdConfig from '../../util/confReader.js';

import { authorize } from './auth.js';

const router = express.Router();
const configReader = new ShorttpdConfig();

router.use('/*', (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
    console.log(`[[Connect Authorization - ${ip}]]:: ${req.originalUrl} ${new Date().toLocaleString()}`);

    next();
})
/** Router
 * Authorization
 */

router.post('/login', async (req, res, next) => {
    if(configReader.config.data.auth.use_auth === 'yes'){
        const authResult = await authorize(req.body.name, req.body.password);
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