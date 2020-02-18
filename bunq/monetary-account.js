module.exports = function (RED) {
    'use strict';
    
    function validation(field) {
        var message = "";

        if (field.action=="createPayment" || field.action=="createRequestPayment") {
            var date = new Date();
            if (field.amount==null) {
                message = "Missing amount";
            } else if (field.currency==null) {
                message = "Missing currency";
            } else if (field.counterpartytype==null) {
                message = "Missing counterpartyType";
            } else if (field.counterpartyval==null) {
                message = "Missing counterpartyValue";
            }else if (field.description==null) {
                message = "Missing description";
            } else if (field.timestart!=null && /^\d\d\d\d-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])T(00|[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9]):([0-9]|[0-5][0-9])\.([0-9][0-9][0-9])Z$/.test(field.timestart)==false) {
                message = "Wrong UTC format timeStart";
            } else if (field.timeend!=null && /^\d\d\d\d-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])T(00|[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9]):([0-9]|[0-5][0-9])\.([0-9][0-9][0-9])Z$/.test(field.timeend)==false) {
                message = "Wrong UTC format timeEnd";
            } else if (field.schedule===false && field.unit!=null && (field.unit=="ONCE" || field.unit=="HOURLY" || field.unit=="DAILY" || field.unit=="WEEKLY" || field.unit=="MONTHLY" || field.unit=="YEARLY")) {
                message = "Wrong schedule unit format";
            } else if (field.counterpartytype==="IBAN" && field.counterpartyname==null) {
                message = "Missing counterpartyName";
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
                "counterpartytype": (n.counterpartytype) ? n.counterpartytype : (msg.payload.counterpartyType) ? msg.payload.counterpartyType : null,
                "counterpartyval": (n.counterpartyval) ? n.counterpartyval : (msg.payload.counterpartyValue) ? msg.payload.counterpartyValue : null,
                "counterpartyname": (n.counterpartyname) ? n.counterpartyname : (msg.payload.counterpartyName) ? msg.payload.counterpartyName : null,
                "description": (n.description) ? n.description : (msg.payload.description) ? msg.payload.description : null,
                "timestart": (n.timestart) ? n.timestart : (msg.payload.timeStart) ? msg.payload.timeStart : null,
                "timeend": (n.timeend) ? n.timeend : (msg.payload.timeEnd) ? msg.payload.timeEnd : null,
                "schedule": (n.schedule) ? n.schedule : (msg.payload.schedule) ? msg.payload.schedule : null,
                "unit": (n.unit) ? n.unit : (msg.payload.timeUnit) ? msg.payload.timeUnit : null,
                "size": (n.size) ? n.size : (msg.payload.timeSize) ? msg.payload.timeSize : null
            };
            var req = {
                "method": "GET",
                "url": '/user/{userID}/monetary-account/',
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
                if (field.timestart==null) {
                    var date = new Date();
                    field.timestart = date.getUTCFullYear()+'-'+date.getUTCMonth()+'-'+date.getUTCDate()+'T'+date.getUTCHours()+':'+date.getUTCMinutes()+':'+date.getUTCSeconds()+'.000Z'
                }
                if (field.schedule===false) {
                    field.timeend = field.timestart;
                    field.unit = 'ONCE';
                    field.size = "1";
                }
                if (field.action=='getMonetaryAccount') {
                    req.url = (field.itemid!=null) ? req.url+'/'+field.itemid : req.url;
                } else if (field.action=='getSavings') {
                    req.url = '/user/{userID}/monetary-account-savings';
                    req.url = (field.itemid!=null) ? req.url+'/'+field.itemid : req.url;
                } else if (field.action=='getPayment') {
                    req.url = req.url+field.monetaryaccountid+'/payment';
                    req.url = (field.itemid!=null) ? req.url+'/'+field.itemid : req.url;
                } else if (field.action=='getSchedulePayment') {
                    req.url = req.url+field.monetaryaccountid+'/schedule-payment';
                    req.url = (field.itemid!=null) ? req.url+'/'+field.itemid : req.url;
                } else if (field.action=='getDraftPayment') {
                    req.url = req.url+field.monetaryaccountid+'/draft-payment';
                    req.url = (field.itemid!=null) ? req.url+'/'+field.itemid : req.url;
                } else if (field.action=='getRequestPayment') {
                    req.url = req.url+field.monetaryaccountid+'/request-inquiry';
                    req.url = (field.itemid!=null) ? req.url+'/'+field.itemid : req.url;
                } else if (field.action=='createPayment') {
                    req.method = "POST";
                    if (field.counterpartytype=="INTERNAL") {
                        req.url = req.url+field.monetaryaccountid+'/payment';
                        req.body = {
                            "amount":{
                                "value":field.amount,
                                "currency":field.currency
                            },
                            "counterparty_alias":{
                                "type":"IBAN",
                                "value":field.counterpartyval,
                                "name": "{userDisplayname}"
                            },
                            "description":field.description
                        };
                    } else {
                        req.url = req.url+field.monetaryaccountid+'/draft-payment';
                        req.body = {
                            "status":"ACTIVE",
                                "entries":[{
                                "amount":{
                                    "value":field.amount,
                                    "currency":field.currency
                                },
                                "counterparty_alias":{
                                    "type":field.counterpartytype,
                                    "value":field.counterpartyval
                                },
                                "description":field.description
                            }],
                            "number_of_required_accepts":1
                        };
                        if (field.counterpartytype=="IBAN") {
                            req.body.entries[0].counterparty_alias.name = field.counterpartyname;
                        }
                    }
                    if (field.schedule!=null) {
                        req.body.schedule = {};
                        req.body.schedule.time_start = field.timestart;
                        if (field.timeend!=null) { req.body.schedule.time_end = field.timeend; }
                        req.body.schedule.recurrence_unit = field.unit;
                        req.body.schedule.recurrence_size = field.size;
                    }
                } else if (field.action=='createRequestPayment') {
                    req.method = "POST";
                    req.url = req.url+field.monetaryaccountid+'/request-inquiry';
                    req.body = {
                        "amount_inquired":{
                            "value":field.amount,
                            "currency":field.currency
                        },
                        "counterparty_alias":{
                            "type":(field.counterpartytype=="INTERNAL") ? "IBAN" : field.counterpartytype,
                            "value":field.counterpartyval,
                            "name": (field.counterpartyname!==null) ? field.counterpartyname : "{userDisplayname}"
                        },
                        "description":field.description,
                        "allow_bunqme": true
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

    RED.nodes.registerType("bunq-monetaryaccount", Node);
};