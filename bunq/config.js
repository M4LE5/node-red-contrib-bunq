const bunqInstance = require('../bunq');
var bunqnode = null;

module.exports = function(RED) {
    function Node(n) {
        RED.nodes.createNode(this, n);

        this.privatekeyclient = n.privatekeyclient;
        this.installationtoken = n.installationtoken;
        this.xbunqgeolocation = n.xbunqgeolocation;
        this.sandbox = n.sandbox;

        this.bunqInstance = new bunqInstance(this);
        bunqnode = this;
    }
    RED.nodes.registerType('bunq-config', Node, {
        credentials: {
            apikey: {type:'text'}
        }
    });

    RED.httpAdmin.get('/bunq/user/monetary-account', function(req, res) {
        new Promise(function(resolve) {
            if (req.params.hasOwnProperty('force') || Object.entries(bunqnode.bunqInstance.user).length === 0) {
                bunqnode.bunqInstance.API("GET", '/user/{userID}/monetary-account').then(function(msg) {
                    if (!msg.hasOwnProperty('error')) {
                        resolve(msg.payload.Response);
                    }
                });
            } else {
                resolve(bunqnode.bunqInstance.user.monetary_accounts);
            }
        }).then(msg => {
            var retoure = [];
            var acc = msg;
            for (var i = 0; i < acc.length; i++) {
                Object.keys(acc[i]).forEach(function(k){
                    for (var ii = 0; ii < acc[i][k].alias.length; ii++) {
                        if (acc[i][k].alias[ii].type=="IBAN") {
                            retoure.push({
                                "v": acc[i][k].alias[ii].value,
                                "t": acc[i][k].alias[ii].name,
                                "id": acc[i][k].id
                            });
                        }
                    }
                });
            }
            res.json(retoure);
        });
    });
};