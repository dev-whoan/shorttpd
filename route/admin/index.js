import express from 'express';
import DBAcceesor from '../../database/dba.js';
import ShorttpdConfig from '../../util/confReader.js';

const router = express.Router();
const configReader = new ShorttpdConfig();
const adminKey = configReader.config.data.auth.server_key;

router.use('/*', (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
    console.log(`[[Connect Admin - ${ip}]]:: ${req.originalUrl} ${new Date().toLocaleString()}`);

    next();
})
/** Router
 * Admin Page
 */
router.post('/auth', async (req, res, next) => {
    if(req.body.key === adminKey){
        return res.status(200).json({
            code: 200,
            message: "Hello, Admin!"
        });
    }

    return res.status(401).json({
        code: 401,
        message: 'Unauthorized'
    });
});

router.post('/users', async (req, res, next) => {
    if(req.body.key !== adminKey){
        return res.status(401).json({
            code: 401,
            message: 'Unauthorized'
        });
    }

    const dba = new DBAcceesor();
    const users = await dba.getUsers();

    return res.status(200).json({
        code: 200,
        data: users
    })
});

router.post('/register', async (req, res, next) => {
    if(req.body.key !== adminKey){
        return res.status(401).json({
            code: 401,
            message: 'Unauthorized'
        });
    }

    try{
        const id = req.body.id;
        const pw = req.body.pw;
        const dba = new DBAcceesor();
        const result = await dba.addUser(id, pw);

        return res.status(result.code).json({
            code: result.code,
            data: result
        })
    } catch (e){
        console.log(e);
        return res.status(500).json({
            code: 500,
            message: "Internal Server Error"
        })
    }
});

router.post('/unregister', async (req, res, next) => {
    if(req.body.key !== adminKey){
        return res.status(401).json({
            code: 401,
            message: 'Unauthorized'
        });
    }

    try{
        const id = req.body.id;
        const dba = new DBAcceesor();
        const result = await dba.delUser(id);

        return res.status(result.code).json({
            code: result.code,
            data: result
        })
    } catch (e){
        console.log(e);
        return res.status(500).json({
            code: 500,
            message: "Internal Server Error"
        })
    }
});

export default router;