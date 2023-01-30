import ShorttpdConfig from '../../util/confReader.js';
import Crypto from 'crypto';
import DBAcceesor from '../../database/dba.js';

/** Variables
 * Config Reader
 */
const configReader = new ShorttpdConfig();
// const webViewExtensions = configReader.config.data.http.web_view_extension.split(',');
const createHashedPassword = (data) => {
    return Crypto.createHash("sha256").update(data).digest("hex");
};

const authorize = async (name, password) => {
    const dba = new DBAcceesor();
    try{
        const result = await dba.authUser(name, password);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export {
    authorize
};