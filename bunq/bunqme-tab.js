module.exports = function (RED) {
    'use strict';
    
    function validation(field) {
        var message = "";

        if ((field.action=="getResult" || field.action=="cancel") && field.itemid==null) {
            message = "Missing itemID";
        } else if (field.action=="create") {
            if (field.amount==null) {
                message = "Missing amount";
            } else if (field.currency==null) {
                message = "Missing currency";
            } else if (field.description==null) {
                message = "Missing description";
            }
        }

        return message;
    }
	
	function Node(n) {
		RED.nodes.createNode(this, n);

		var bunqnode = RED.nodes.getNode(n.bunqnode);
        var node = this;

		this.on('input', function (msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }

            //presettings
            var field = {
                "action": n.action,
                "monetaryaccountid": n.monetaryaccountid,
                "itemid": (n.itemid) ? n.itemid : (msg.payload.itemID) ? msg.payload.itemID : null,
                "amount": (n.amount) ? n.amount : (msg.payload.amount) ? msg.payload.amount : null,
                "currency": (n.currency) ? n.currency : (msg.payload.currency) ? msg.payload.currency : null,
                "description": (n.description) ? n.description : (msg.payload.description) ? msg.payload.description : null
            };
            var req = {
                "method": "GET",
                "url": '/user/{userID}/monetary-account/'+field.monetaryaccountid,
                "body": null,
                "options": {}
            };
            var error = {
                "message": ""
            };

            //validation
            error.message = validation(field);

            if (error.message!="") {
                node.error(error.message);
                node.status({fill:"red",shape:"ring",text:error.message});
            } else {
                node.status({fill:"yellow",shape:"ring",text:"Initialization"});
    
                //process
                if (field.action=='create') {
                    req.method = "POST";
                    req.url = req.url + '/bunqme-tab';
                    req.body = {
                        "bunqme_tab_entry": {
                            "amount_inquired": {
                                "value": field.amount,
                                "currency": field.currency
                            },
                            "description": field.description
                        }
                    };
                } else if (field.action=='cancel') {
                    req.method = "PUT";
                    req.url = req.url+'/bunqme-tab/'+field.itemid;
                    req.body = {"status": "CANCELLED"};
                } else if (field.action=='get') {
                    req.url = (field.itemid!=null) ? req.url+'/bunqme-tab/'+field.itemid : req.url+'/bunqme-tab';
                } else if (field.action=='getResult') {
                    req.url = req.url+'/bunqme-tab-result-response/'+field.itemid;
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

    RED.nodes.registerType("bunq-bunqmetab", Node);
};