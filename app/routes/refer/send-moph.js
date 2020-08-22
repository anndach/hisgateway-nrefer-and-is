"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const HttpStatus = require("http-status-codes");
const moment = require("moment");
var http = require('http');
var querystring = require('querystring');
const request = require('request');
const router = (fastify, {}, next) => {
    var db = fastify.dbHIS;
    fastify.get('/sending-process/:?date', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const now = moment().locale('th').format('YYYY-MM-DD');
        const trust = req.headers.host.search('localhost|127.0.0.1') > -1;
        const apiKey = process.env.NREFER_APIKEY;
        const secretKey = process.env.NREFER_SECRETKEY;
        const date = req.params.date || now;
        if (!trust || !apiKey || !secretKey) {
            reply.status(HttpStatus.UNAUTHORIZED).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) });
        }
        let tokenLocal = '';
        let tokenNRefer = '';
        try {
            const resultLocalToken = yield getLocalToken();
            if (resultLocalToken.token) {
                tokenLocal = resultLocalToken.token;
            }
        }
        catch (err) {
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST), error: err.message });
            return false;
        }
        try {
            const result = yield getNReferToken(apiKey, secretKey);
            if (result.statusCode && result.statusCode === 200 && result.token) {
                tokenNRefer = result.token;
            }
            else {
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST), error: result.message });
                return false;
            }
        }
        catch (error) {
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR), error: error.message });
            return false;
        }
        ;
        let referOut = [];
        let noCases = 0;
        if (tokenNRefer) {
            try {
                const resultReferout = yield getReferOut(tokenLocal, date);
                if (resultReferout.statusCode === 200) {
                    referOut = resultReferout.rows;
                }
                else {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR),
                        error: resultReferout.message
                    });
                    return false;
                }
            }
            catch (error) {
                console.log('referOut error:', error.message);
                reply.status(HttpStatus.OK).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR),
                    error: error.message
                });
                return false;
            }
        }
        else {
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) });
            return false;
        }
        if (referOut.length) {
            noCases = referOut.length;
            const person = [];
            console.log('referout', noCases);
            referOut.forEach((row, index) => {
                try {
                    const formData = {
                        hospcode: row.hospcode,
                        hn: row.hn
                    };
                    getData('person', tokenLocal, formData)
                        .then((resultGetData) => {
                        if (resultGetData.statusCode === 200) {
                            sendPerson('person', tokenNRefer, resultGetData.rows)
                                .then((resultSavePerson) => {
                                console.log('save person:', resultSavePerson);
                                person.push(resultGetData.rows[0]);
                                console.log(resultGetData.rows[0].hn, resultGetData.rows[0].fname);
                            });
                        }
                    });
                }
                catch (err) {
                }
            });
        }
        setTimeout(() => {
            try {
                const result = expireToken(tokenNRefer);
            }
            catch (error) {
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) });
                return false;
            }
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, message: noCases });
        }, 5000);
    }));
    next();
};
function getLocalToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const apiHttpProtocol = (process.env.HTTPS && +process.env.HTTPS === 1) ? 'https' : 'http';
        const apiPort = process.env.PORT;
        const url = `${apiHttpProtocol}://127.0.0.1:${apiPort}/get-token`;
        const options = {
            url: url,
            method: 'GET'
        };
        return new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    resolve(JSON.parse(body));
                }
                else {
                    reject(error);
                }
            });
        });
    });
}
function getToken(apiKey, secretKey) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = process.env.NREFER_URL1;
        url += url.substr(-1, 1) === '/' ? '' : '/';
        const postData = querystring.stringify({
            apiKey: apiKey, secretKey: secretKey
        });
        const options = {
            hostname: process.env.NREFER_URL,
            port: process.env.NREFER_PORT,
            path: process.env.NREFER_PATH + '/login/api-key',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        let ret = '';
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    ret += chunk;
                });
                res.on('end', () => {
                    const data = JSON.parse(ret);
                    resolve(data);
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            req.write(postData);
            req.end();
        });
    });
}
function getNReferToken(apiKey, secretKey) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = process.env.NREFER_URL1;
        url += url.substr(-1, 1) === '/' ? '' : '/';
        const postData = querystring.stringify({
            apiKey: apiKey, secretKey: secretKey
        });
        const options = {
            hostname: process.env.NREFER_URL,
            port: process.env.NREFER_PORT,
            path: process.env.NREFER_PATH + '/login/get-token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        let ret = '';
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    ret += chunk;
                });
                res.on('end', () => {
                    const data = JSON.parse(ret);
                    resolve(data);
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            req.write(postData);
            req.end();
        });
    });
}
function expireToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = process.env.NREFER_URL1;
        url += url.substr(-1, 1) === '/' ? '' : '/';
        const postData = querystring.stringify({
            token: token
        });
        const options = {
            hostname: process.env.NREFER_URL,
            port: process.env.NREFER_PORT,
            path: process.env.NREFER_PATH + '/login/expire-token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        let ret = '';
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    ret += chunk;
                });
                res.on('end', () => {
                    const data = JSON.parse(ret);
                    resolve(data);
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            req.write(postData);
            req.end();
        });
    });
}
function getReferOut(tokenLocal, date) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiHttpProtocol = (process.env.HTTPS && +process.env.HTTPS === 1) ? 'https' : 'http';
        const apiPort = process.env.PORT;
        const url = `${apiHttpProtocol}://127.0.0.1:${apiPort}/refer/referout`;
        const postData = querystring.stringify({
            date: date, hospcode: process.env.HOSPCODE
        });
        const options = {
            url: url,
            method: 'POST',
            headers: {
                'User-Agent': 'Super Agent/0.0.1',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${tokenLocal}`,
                'Content-Length': Buffer.byteLength(postData)
            },
            form: { date: date, hospcode: process.env.HOSPCODE }
        };
        return new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    resolve(JSON.parse(body));
                }
                else {
                    reject(error);
                }
            });
        });
    });
}
function getData(routeName, tokenLocal, postData) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiHttpProtocol = (process.env.HTTPS && +process.env.HTTPS === 1) ? 'https' : 'http';
        const apiPort = process.env.PORT;
        const url = `${apiHttpProtocol}://127.0.0.1:${apiPort}/refer/${routeName}`;
        const formData = querystring.stringify(postData);
        const options = {
            url: url,
            method: 'POST',
            headers: {
                'User-Agent': 'Super Agent/0.0.1',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${tokenLocal}`,
                'Content-Length': Buffer.byteLength(formData)
            },
            form: postData
        };
        return new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    resolve(JSON.parse(body));
                }
                else {
                    reject(error);
                }
            });
        });
    });
}
function sendPerson(tableName, tokenNRefer, data) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = process.env.NREFER_URL1;
        url += url.substr(-1, 1) === '/' ? '' : '/';
        url += 'ws/save-person';
        const formData = { token: tokenNRefer, tableName: tableName, data: JSON.stringify(data) };
        const postData = querystring.stringify(formData);
        const options = {
            url: url,
            method: 'POST',
            headers: {
                'User-Agent': 'Super Agent/0.0.1',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${tokenNRefer}`,
                'Content-Length': Buffer.byteLength(postData)
            },
            form: formData
        };
        return new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    resolve(JSON.parse(body));
                }
                else {
                    reject(error);
                }
            });
        });
    });
}
module.exports = router;
