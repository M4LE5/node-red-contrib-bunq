module.exports = function (RED) {
    'use strict';
	
	function Node(n) {
		RED.nodes.createNode(this, n);

		var bunqnode = RED.nodes.getNode(n.bunqnode);
        var node = this;

		this.on('input', function (msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }

            //presettings
            var field = {
                "itemid": (n.itemid) ? n.itemid : (msg.payload.itemID) ? msg.payload.itemID : null
            };
            var req = {
                "method": "GET",
                "url": '/user/{userID}/event',
                "body": null,
                "options": {}
            };
            var error = {
                "message": ""
            };

            node.status({fill:"yellow",shape:"ring",text:"Initialization"});
    
            //process
            req.url = (field.itemid!=null) ? req.url+'/'+field.itemid : req.url;

            bunqnode.bunqInstance.API(req.method, req.url, req.body, req.options).then(function(msg) {
                if (msg.hasOwnProperty('error')) {
                    node.status({fill:"red",shape:"ring",text:"Error"});
                } else {
                    node.status({fill:"green",shape:"ring",text:"Success"});
                }
                send(msg);
            });
            done();
		});
	}

	RED.nodes.registerType("bunq-event", Node);
};