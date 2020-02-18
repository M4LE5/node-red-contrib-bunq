module.exports = function (RED) {
    'use strict';
    
    function validation(field) {
        var message = "";

        if (field.description==null) {
            message = "Missing description";
        } else if (field.permittedips==null) {
            message = "Missing permittedips";
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
                "description": (n.description) ? n.description : (msg.payload.description) ? msg.payload.description : null,
                "permittedips": (n.permittedips) ? n.permittedips : (msg.payload.permittedips) ? msg.payload.permittedips : null
            };
            var req = {
                "method": "POST",
                "url": '/device-server',
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
				req.body = {
                    "description": field.description,
                    "secret": bunqnode.bunqInstance.config.apikey,
                    "permitted_ips": field.permittedips
                };
				req.options = {"isInstalltoken": true};

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

	RED.nodes.registerType("bunq-deviceserver", Node);
};