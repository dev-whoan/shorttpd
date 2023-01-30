import sqlite from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_TABLE_NAME = 'SHORTTPD_AUTH';
const dbPath = path.join(__dirname, 'user.db');

export default class DBAcceesor {
    static instance;
    constructor(){
        if(DBAcceesor.instance) return DBAcceesor.instance;

        this.db = null;
        //this.db = new sqlite.Database(dbPath);
        this.initialize();

        DBAcceesor.instance = this;
    }

    initialize(){
        this.db = new sqlite.Database(dbPath);

        this.db.serialize( () => {
            let tableList = [];
            const db = this.db;
            db.all("select name from sqlite_master where type='table'", function(err, tables) {
                tableList = tables.filter((table) => table.name === AUTH_TABLE_NAME);
                if(tableList.length === 0){
                    const stmt = db.prepare(`create table ${AUTH_TABLE_NAME} (SEQ integer primary key autoincrement, name text not null, password text not null, perm text)`);
                    stmt.run();
                    stmt.finalize();
                }
                db.close();
            });
        });
        
    }

    async authUser(name, password){
        return new Promise((resolve, reject) => {
            this.db = new sqlite.Database(dbPath);

            const db = this.db;
            this.db.serialize( () => {
                const stmt = db.prepare(`SELECT * FROM ${AUTH_TABLE_NAME} WHERE name = ? AND password = ?`, name, password);
                stmt.all([name, password], function(err, user) {
                    if(err){
                        console.log("getUser Error:", err)
                        return reject({
                            code: 500,
                            message: err
                        });
                    }

                    if(user.length === 0){
                        return reject({
                            code: 401,
                            message: 'Unauthorized'
                        });
                    }
                    return resolve({
                        code: 200,
                        data: user
                    });
                });
                stmt.finalize();
            });
            this.db.close();
        });
    }

    async getUsers(){
        return new Promise((resolve, reject) => {
            this.db = new sqlite.Database(dbPath);

            const db = this.db;
            this.db.serialize( () => {
                const stmt = db.prepare(`SELECT name, perm FROM ${AUTH_TABLE_NAME}`);
                stmt.all([], function(err, user) {
                    if(err){
                        console.log("getUser Error:", err)
                        reject(err);
                    }

                    return resolve({
                        code: 200,
                        data: user
                    });
                });

                stmt.finalize();
            });
            this.db.close();
        });
    }

    async getUser(name){
        return new Promise((resolve, reject) => {
            this.db = new sqlite.Database(dbPath);

            const db = this.db;
            this.db.serialize( () => {
                const stmt = db.prepare(`SELECT name, perm FROM ${AUTH_TABLE_NAME} WHERE name = ?`);
                stmt.all(name, function(err, user) {
                    if(err){
                        console.log("getUser Error:", err)
                        reject(err);
                    }

                    return resolve({
                        code: 200,
                        data: user
                    });
                });

                stmt.finalize();
            });
            this.db.close();
        });
    }
    
    async addUser(name, password) {
        return new Promise(async (resolve, reject) => {
            let userData;
            try{
                userData = await this.getUser(name, password);
            } catch (e) {
                console.log('addUser e: ', e);
            }
            
            if(userData.data.length !== 0){
                return reject({
                    code: 409,
                    message: 'User Already Exist'
                });
            }

            this.db = new sqlite.Database(dbPath);
            const db = this.db;

            this.db.serialize( () => {
                const stmt = db.prepare(`INSERT INTO ${AUTH_TABLE_NAME} (name, password, perm) VALUES (?, ?, '*')`, name, password);
                stmt.run([name, password], function(err) {
                    if(err){
                        return reject({
                            code: 500,
                            message: err
                        })
                    }
                    return resolve({
                        code: this.changes === 1 ? 201 : 200,
                        data: this
                    });
                });
                stmt.finalize();
            });
            this.db.close();
        });
    }

    async delUser(name) {
        return new Promise(async (resolve, reject) => {
            this.db = new sqlite.Database(dbPath);
            const db = this.db;

            this.db.serialize( () => {
                const stmt = db.prepare(`DELETE FROM ${AUTH_TABLE_NAME} WHERE name = ?`, name);
                stmt.run([], function(err){
                    if(err){
                        console.log(err);
                        return reject({
                            code: 500,
                            message: err
                        })
                    }

                    return resolve({
                        code: 200,
                        message: this.changes !== 0 ? 'Succeed to remove user' : 'No user to remove'
                    });
                })
                stmt.finalize();
            });
            this.db.close();
        });
    }
}

/*
const dba = new DBAcceesor();
try{
    console.log(
        await dba.getUsers()
    )
    
    await dba.addUser('hello', 'abc');
await dba.addUser('hello1', 'abc');
await dba.addUser('hello2', 'abc');
await dba.addUser('hello3', 'abc');
await dba.addUser('hello4', 'abc');
await dba.addUser('hello5', 'abc');
await dba.addUser('hello6', 'abc');
await dba.addUser('hello7', 'abc');
await dba.addUser('hello8', 'abc');
await dba.addUser('hello9', 'abc');
await dba.addUser('hello10', 'abc');
await dba.addUser('hello11', 'abc');

} catch (ignore) {}
*/