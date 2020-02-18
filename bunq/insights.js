module.exports = function (RED) {
    'use strict';
    
    function validation(field) {
        var message = "";

        if (field.time_start==null) {
            message = "Missing start time";
        } else if (field.time_end==null) {
            message = "Missing end time";
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
                "time_start": (n.timestart) ? n.timestart : (msg.payload.time_start) ? msg.payload.time_start : null,
                "time_end": (n.timeend) ? n.timeend : (msg.payload.time_end) ? msg.payload.time_end : null
            };
            var req = {
                "method": "GET",
                "url": '/user/{userID}/insights?time_start='+field.time_start+'&time_end='+field.time_end,
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

	RED.nodes.registerType("bunq-insights", Node);
};