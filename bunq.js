class bunq {
    constructor(node) {
        this.crypto = require('crypto');
        this.fs = require('fs');
        this.request = require('request');

        this.nodeInstance = node;

        if (node.sandbox) {
            this.baseurl = 'https://public-api.sandbox.bunq.com/v1';
        } else {
            this.baseurl = 'https://api.bunq.com/v1';
        }
        this.config = {
            "name": node.name,
            "apikey": node.credentials.apikey,
            "privatekeyclient": node.privatekeyclient,
            "installationtoken": node.installationtoken,
            "xbunqrequestid": this.generateRequestId(),
            "xbunqgeolocation": node.xbunqgeolocation || '0 0 0 0 000',
            "sandbox": node.sandbox || false
        };
        this.user = {};
        this.token = null;
        this.timeout = new Date();
    }

    generateRequestId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    generateRSA() {
        const { generateKeyPairSync } = require('crypto');
        var { publicKey, privateKey } = generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });

        this.fs.writeFileSync(__dirname + '/public_key.pem', publicKey);
        this.fs.writeFileSync(__dirname + '/private_key.pem', privateKey);

        return {"privatekeyclient": __dirname + "/private_key.pem", "publicKey": publicKey.split("\r\n").join("\\n"), "privateKey": privateKey.split("\r\n").join("\\n")};
    }

    readPem() {
        var file = (this.config.privatekeyclient != "") ? this.config.privatekeyclient : __dirname + '/private_key.pem';
        try {
            return this.fs.readFileSync(file, 'utf8');
        } catch(err) {
            this.nodeInstance.error(err);
            return null;
        }
    }

    signBody(body) {
        const sign = this.crypto.createSign('SHA256');

        sign.write(body);
        sign.end();

        try {
            return sign.sign(this.readPem(), 'base64');
        } catch(err) {
            this.nodeInstance.error(err);
            return null;
        }
    }

    getToken(options) {
        var t_class = this;
        options = typeof options === 'object' ? options : {};
        var noAuth = (options.hasOwnProperty("noAuth")) ? options.noAuth : false;
        var isInstalltoken = (options.hasOwnProperty("isInstalltoken")) ? options.isInstalltoken : false;
        var msg = {};

        if (isInstalltoken==true) {
            return new Promise(function(resolve) {
                resolve(t_class.config.installationtoken);
            }).then(function(msg){
                return msg;
            });
        } else if (noAuth==true) {
            return new Promise(function(resolve) {
                resolve("");
            }).then(function(msg){
                return msg;
            });
        } else {
            var past = this.timeout;
            var now = new Date();
            if (past <= now) {
                return new Promise(function(resolve) {
                    var body = '{"secret":"'+t_class.config.apikey+'"}';
                    var headers = {
                        "Content-Type": "application/json",
                        "Cache-Control": "no-cache",
                        "User-Agent": "Node-Red",
                        "X-Bunq-Language": t_class.user.language || 'en_US',
                        "X-Bunq-Region": t_class.user.region || 'en_US',
                        "X-Bunq-Client-Request-Id": t_class.config.xbunqrequestid,
                        "X-Bunq-Geolocation": t_class.config.xbunqgeolocation || '0 0 0 0 000',
                        "X-Bunq-Client-Authentication": t_class.config.installationtoken,
                        "X-Bunq-Client-Signature": t_class.signBody(body)
                    };
                    
                    t_class.request.post({
                        url: t_class.baseurl + '/session-server',
                        headers: headers,
                        body: body
                      }, function (error, response, body) {
                        msg.response = response;
                        msg.payload = response;
                        try {
                            msg.payload = JSON.parse(response.body);
                        } catch(e) {}
                        if (response.statusCode != 200) {
                            msg.error = true;
                        } else {
                            msg.timeout = msg.payload.Response[2].UserPerson.session_timeout;
                            msg.token = msg.payload.Response[1].Token.token;
    
                            var now = new Date();
                            now.setSeconds(now.getSeconds() + msg.timeout);
                            t_class.timeout = now;
                            t_class.token = JSON.parse(response.body).Response[1].Token.token;
                        }
                        resolve(msg);
                    });
                }).then(function(){
                    return new Promise(function(resolve) {
                        var msg = {};
                        var headers = {
                            "Content-Type": "application/json",
                            "Cache-Control": "no-cache",
                            "User-Agent": "Node-Red",
                            "X-Bunq-Language": t_class.user.language || 'en_US',
                            "X-Bunq-Region": t_class.user.region || 'en_US',
                            "X-Bunq-Client-Request-Id": t_class.config.xbunqrequestid,
                            "X-Bunq-Geolocation": t_class.config.xbunqgeolocation,
                            "X-Bunq-Client-Signature": t_class.signBody(""),
                            "X-Bunq-Client-Authentication": t_class.token
                        };
            
                        t_class.request.get({
                            url: t_class.baseurl + "/user",
                            headers: headers,
                            }, function (error, response, body) {
                            if (response.statusCode == 200) {
                                try {
                                    response = JSON.parse(response.body);
                                } catch(e) {}
                                msg = response.Response[0].UserPerson;
                            }
                            resolve(msg);
                        });
                    });
                }).then(msg => {
                    return new Promise(function(resolve) {
                        var headers = {
                            "Content-Type": "application/json",
                            "Cache-Control": "no-cache",
                            "User-Agent": "Node-Red",
                            "X-Bunq-Language": t_class.user.language || 'en_US',
                            "X-Bunq-Region": t_class.user.region || 'en_US',
                            "X-Bunq-Client-Request-Id": t_class.config.xbunqrequestid,
                            "X-Bunq-Geolocation": t_class.config.xbunqgeolocation,
                            "X-Bunq-Client-Signature": t_class.signBody(""),
                            "X-Bunq-Client-Authentication": t_class.token
                        };
                        t_class.request.get({
                            url: t_class.baseurl + "/user/"+msg.id+"/monetary-account",
                            headers: headers,
                            }, function (error, response, body) {
                            if (response.statusCode == 200) {
                                try {
                                    response = JSON.parse(response.body);
                                } catch(e) {}
                                 msg.monetary_accounts = response.Response;
                            }
                            resolve(msg);
                        });
                    });
                }).then(msg => {
                    t_class.user = msg || {};
                    return t_class.token;
                });
            } else {
                return new Promise(function(resolve) {
                    resolve(t_class.token);
                }).then(function(msg){
                    return msg;
                });
            }
        }
    }

    API(method, url, body, option) {
        var t_class = this;
        body = (typeof body !== 'undefined') ? JSON.stringify(body) : "";
        option = typeof option === 'object' ? option : {};
        option = {
            "noSigning": (option.hasOwnProperty("noSigning")) ? option.noSigning : false,
            "noAuth": (option.hasOwnProperty("noAuth")) ? option.noAuth : false,
            "isInstalltoken": (option.hasOwnProperty("isInstalltoken")) ? option.isInstalltoken : false
        };

        body = body.replace(/{userDisplayname}/g, t_class.user.display_name);

        return this.getToken({"isInstalltoken": option.isInstalltoken, "noAuth": option.noAuth, "noSigning": option.noSigning}).then(function(token) {
            return new Promise(function(resolve) {
                var msg = {};
                var headers = {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                    "User-Agent": "Node-Red",
                    "X-Bunq-Language": t_class.user.language,
                    "X-Bunq-Region": t_class.user.region,
                    "X-Bunq-Client-Request-Id": t_class.config.xbunqrequestid,
                    "X-Bunq-Geolocation": t_class.config.xbunqgeolocation
                };
                if (option.noSigning==false) {
                    headers["X-Bunq-Client-Signature"] = t_class.signBody(body);
                }
                if (option.noAuth==false) {
                    headers["X-Bunq-Client-Authentication"] = t_class.token;
                }
                url = url.replace(/{userID}/g, t_class.user.id);

                var options = {
                    "url": t_class.baseurl + url,
                    "method": method,
                    "headers": headers,
                    "body": (body!="") ? body : null
                };
                
                if (method=="POST") {
                    t_class.request.post(options, function (error, response, body) {
                        msg.response = response;
                        msg.payload = response;
                        try {
                            msg.payload = JSON.parse(response.body);
                        } catch(e) {}
                        if (response.statusCode != 200) {
                            msg.error = true;
                        }
                        resolve(msg);
                    });
                } else if (method=="PUT") {
                    t_class.request.put(options, function (error, response, body) {
                        msg.response = response;
                        msg.payload = response;
                        try {
                            msg.payload = JSON.parse(response.body);
                        } catch(e) {}
                        if (response.statusCode != 200) {
                            msg.error = true;
                        }
                        resolve(msg);
                    });
                } else if (method=="DELETE") {
                    t_class.request.delete(options, function (error, response, body) {
                        msg.response = response;
                        msg.payload = response;
                        try {
                            msg.payload = JSON.parse(response.body);
                        } catch(e) {}
                        if (response.statusCode != 200) {
                            msg.error = true;
                        }
                        resolve(msg);
                    });
                } else if (method=="GET") {
                    t_class.request.get(options, function (error, response, body) {
                        msg.response = response;
                        msg.payload = response;
                        try {
                            msg.payload = JSON.parse(response.body);
                        } catch(e) {}
                        if (response.statusCode != 200) {
                            msg.error = true;
                        }
                        resolve(msg);
                    });
                }
            }).then(function(msg){
                return msg;
            });
        });
    }
}

module.exports = bunq;