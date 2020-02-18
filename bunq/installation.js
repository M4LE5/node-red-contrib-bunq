module.exports = function (RED) {
    'use strict';
    
	function Node(n) {
		RED.nodes.createNode(this, n);

		var bunqnode = RED.nodes.getNode(n.bunqnode);
		var node = this;

		this.on('input', function (msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }

			//preseting
			var key = bunqnode.bunqInstance.generateRSA();
			var req = {
                "method": "POST",
                "url": '/installation',
                "body": {
					"client_public_key": key.publicKey.replace(/\r?\n|\r/g, '\\n').slice(0, -2)
				},
                "options": {"noAuth": true}
            };
			
			node.status({fill:"yellow",shape:"ring",text:"Initialization"});
    
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

	RED.nodes.registerType("bunq-installation", Node);
};