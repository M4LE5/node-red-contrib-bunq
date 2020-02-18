module.exports = function (RED) {
    'use strict';
    
	function Node(n) {
		RED.nodes.createNode(this, n);

		var bunqnode = RED.nodes.getNode(n.bunqnode);
		var node = this;

		this.on('input', function (msg, send, done) {
			send = send || function() { node.send.apply(node,arguments) }
			
			node.status({fill:"yellow",shape:"ring",text:"Initialization"});

			bunqnode.bunqInstance.getToken().then(function(msg) {
				if (msg === null) {
					node.status({fill:"red",shape:"ring",text:"Error"});
				} else {
					msg = {
						"payload": msg
					};
					node.status({fill:"green",shape:"ring",text:"Token received"});
				}
				send(msg);
			});
			done();
		});
	}

	RED.nodes.registerType("bunq-sessionserver", Node);
};