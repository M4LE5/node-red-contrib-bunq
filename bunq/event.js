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
                "itemid": (n.itemid) ? n.itemid : (msg.payload.itemID) ? msg.payload.itemID : null,
                "monetaryaccountid": (n.monetaryaccountid) ? (n.monetaryaccountid=="null") ? null : n.monetaryaccountid : (msg.payload.accountID) ? msg.payload.accountID : null,
                "status": (n.status) ? (n.status=="none") ? null : n.status : (msg.payload.status) ? msg.payload.status : null,
                "displayuserevent": (n.displayuserevent) ? n.displayuserevent : (msg.payload.displayuserevent) ? msg.payload.displayuserevent : null
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
            var params = [];
            if (field.monetaryaccountid!=null) {
                params.push("monetary_account_id="+field.monetaryaccountid);
            }
            if (field.status!=null) {
                params.push("status="+field.status);
            }
            if (field.displayuserevent!=null) {
                params.push("display_user_event="+field.displayuserevent);
            }

            node.status({fill:"yellow",shape:"ring",text:"Initialization"});
    
            //process
            req.url = (field.itemid!=null) ? req.url+'/'+field.itemid : req.url;
            if (params.length > 0) {
                req.url = req.url+'?'+params.join('&');
            }

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