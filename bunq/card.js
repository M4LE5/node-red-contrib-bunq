module.exports = function (RED) {
    'use strict';
    
    function validation(field) {
        var message = "";

        if ((field.action=="setPin" || field.action=="setStatus") && field.itemid==null) {
            message = "Missing itemID";
        } else if (field.action=="setPin") {
            if (field.pincode==null) {
                message = "Missing pincode";
            } else if (field.pincode.length!=4) {
                message = "Wrong PIN format";
            }
        } else if (field.action=="setStatus") {
            if (field.status==null) {
                message = "Missing status";
            }  else if (field.status!="ACTIVE" || field.status!="DEACTIVATED") {
                message = "Wrong format status";
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
                "itemid": (n.itemid) ? n.itemid : (msg.payload.itemID) ? msg.payload.itemID : null,
                "pincode": (n.pincode) ? n.pincode : (msg.payload.pincode) ? msg.payload.pincode : null,
                "status": (n.status) ? n.status : (msg.payload.status) ? msg.payload.status : null
            };
            var req = {
                "method": "GET",
                "url": '/user/{userID}/card',
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
                if (field.action=='setStatus') {
                    req.method = "PUT";
                    req.url = req.url+'/'+field.itemid;
                    req.body = { "status": status };
                } else if (field.action=='setPin') {
                    req.method = "PUT";
                    req.url = req.url+'/'+field.itemid;
                    req.body = {"pin_code": field.pincode};
                } else if (field.action=='get') {
                    req.url = (field.itemid!=null) ? req.url+'/'+field.itemid : req.url;
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

	RED.nodes.registerType("bunq-card", Node);
};