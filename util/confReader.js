import fs from 'fs';
import { ConfigIniParser } from 'config-ini-parser';
import NoShorttpdConfFoundException from '../exception/noShorttpdConfFoundException.js';

const delimiter = '\n';
const cfgParser = new ConfigIniParser(delimiter);

export default class ShorttpdConfig {
    static instance;
    constructor(){
        if(ShorttpdConfig.instance) return ShorttpdConfig.instance;
        
        this.config = {
            raw: null,
            data: null   
        };
        this.initialize();

        ShorttpdConfig.instance = this;
    }

    initialize(){
        try{
            this.config.raw = cfgParser.parse(fs.readFileSync('./shorttpd.conf', 'utf-8'));
            
            this.config.data = {}
            this.config.raw._ini.sections.forEach((item, index) => {
                if(item.name === '__DEFAULT_SECTION__') return false;
                const key = item.name;
                item.options.forEach((sectionItem, sectionIndex) => {
                    if(!this.config.data[key])  this.config.data[key] = {}
                    this.config.data[key][sectionItem.name] = sectionItem.value;
                });
            });
        } catch (e) {
            if(e.message.includes('no such file')){
                throw new NoShorttpdConfFoundException(
                    `Cannot find file [/app/shorttpd.conf]. Are you sure you mounted the conf file?`
                );
            }
            console.log(`confReader.js.initialize ->`, e);
        }
        
    }
}