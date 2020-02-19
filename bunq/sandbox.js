module.exports = function (RED) {
    'use strict';

	function Node(n) {
		RED.nodes.createNode(this, n);

		var bunqnode = RED.nodes.getNode(n.bunqnode);
        var node = this;
        var faker = require('faker');

		this.on('input', function (msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
			
            //preseting
            var field = {
                "action": n.action
            };
			var req = {
                "method": "POST",
                "url": "",
                "body": "",
                "options": {}
			};
			
            if (bunqnode.bunqInstance.config.sandbox==false) {
                node.error("Connection is not a sandbox");
                node.status({fill:"red",shape:"ring",text:"Non sandbox connection"});
            } else {
                node.status({fill:"yellow",shape:"ring",text:"Initialization"});
            
                //process
                if (field.action=='createUser') {
                    req.url = '/sandbox-user?';
                    req.options = {"noAuth": true, "noSigning": true};
                } else if (field.action=='createMonetary') {
                    req.url = '/user/{userID}/monetary-account-bank';
                    req.body = {
                        "currency": "EUR",
                        "description": faker.finance.accountName,
                        "daily_limit": {
                        "value": "100",
                        "currency": "EUR"
                        },
                        "status": "ACTIVE",
                        "setting": {
                        "default_avatar_status": "AVATAR_DEFAULT",
                        "restriction_chat": "ALLOW_INCOMING"
                        }
                    };
                } else if (field.action=='createSaving') {
                    req.url = '/user/{userID}/monetary-account-savings';
                    req.body = {
                        "currency": "EUR",
                        "description": faker.finance.accountName,
                        "daily_limit": {
                        "value": "100",
                        "currency": "EUR"
                        },
                        "status": "ACTIVE",
                        "setting": {
                        "default_avatar_status": "AVATAR_DEFAULT",
                        "restriction_chat": "ALLOW_INCOMING"
                        },
                        "savings_goal": {
                        "value": "100",
                        "currency": "EUR"
                        }
                    };
                }
        
                bunqnode.bunqInstance.API(req.method, req.url, req.body, req.options).then(function(msg) {
                    if (msg.hasOwnProperty('error')) {
                        node.status({fill:"red",shape:"ring",text:"Error"});
                    } else {
                        node.status({fill:"green",shape:"ring",text:"Success"});
                    }
                    send(msg);
                });
            }
            done();
		});
	}

	RED.nodes.registerType("bunq-sandbox", Node);
};