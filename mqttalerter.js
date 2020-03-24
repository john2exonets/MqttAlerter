//
//  MqttAlerter.js
//    Takes in MQTT messages where the topic starts with 'alert' and sends them
//    out to notification services like Facebook Messenger and/or SMS.
//    Looking to make this somewhat configurable for general use.
//
//  John D. Allen
//  (c) 2019 by Exonets, LLC, All Rights Reserved
//  Jan 2019
//

var https = require('https');
var mqtt = require('mqtt');
var config = require('./config/config.json');

var DEBUG = config.debug;
if (DEBUG) { console.log("MqttAlerter started..."); }

// MQTT connection options
var copts = {
  clientId: "mqttAlerter",
  keepalive: 20000
};

var client = mqtt.connect(config.mqtt_broker, copts);

client.on("connect", function() {
  client.subscribe('alert/#');
});

client.on('message', function(topic, message) {
  var out = topic + ": " + message.toString();
  if (DEBUG) { console.log("IN>>" + out); }

  // Check for bad data
  if (message.indexOf("nan") > -1) {
    if (DEBUG) { console.log(">> BAD DATA"); }
    return false;
  }

  // check to see if on ignore list
  if (config.ignoreList.indexOf(topic) != -1) {
    if (DEBUG) { console.log("Topic of " + topic + " on ignore list..."); }
    return false;
  }

  // Find notification service assigned for this alert, if any
  var i = 0;
  var svclen = config.svcList.length;
  for (i = 0; i < svclen; i++) {
    if (DEBUG) { console.log('.'); }
    if (config.svcList[i].alert === topic) {
      // Send the alert
      if (DEBUG) { console.log(">>svc is " + config.svcList[i].svc); }
      sendAlert(topic, message.toString(), config.svcList[i].svc);
      break;  // make sure we don't fall through to default alert!
    }
    if (i == config.svcList.length - 1) {
      // config.svcList[i].alert should be "%%END" for the Default value!!
      if (DEBUG) { console.log(">>default svc is " + config.svcList[i].svc); }
      sendAlert(topic, message.toString(), config.svcList[i].svc);
      break;
    }
  }

});

//-------------------------------------------------------------------------------
// Function: sendAlert()
//   Send out the alrt via the defined service.
//-------------------------------------------------------------------------------
function sendAlert(topic, msg, svc) {
  // topic => MQTT topic in String format
  // msg => MQTT Payload in String format. NOT in JSON format!!
  // svc => Code for which Notification service to use:
  //    0 => None!!
  //    1 => Facebook Messenger
  //    2 => SMS
  //    9 => ALL of Them!!
  if (svc == 0) { return; }
  if (svc == 1) { _sendFBMessenger(topic, msg); }
  if (svc == 2) { _sendSMS(topic, msg); }

  if (svc == 9) {
    _sendFBMessenger(topic, msg);
    _sendSMS(topic, msg);
  }
}

//-------------------------------------------------------------------------------
// Function: _sendFBMessenger()
//   Send alert via FB Messenger Webhook on IFTTT
//-------------------------------------------------------------------------------
function _sendFBMessenger(topic, msg) {
  if (DEBUG) { console.log("_sendFBMessenger(): topic=" + topic +" msg=" + msg); }
  var opts = {
    host: "maker.ifttt.com",
    port: 443,
    path: "/trigger/IoT_Alert/with/key/{Your IFTTT Key Here}",
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  var g = topic.split('/');
  g.shift();
  var t = g.join('/');          // Take the "alert" off the start of the topic and use the rest as the sensor name

  var data = '{ "value1": "' + t + '", "value2": "' + msg + '" }';
  if (DEBUG) { console.log("PAYLOAD: " + data); }

  var req = https.request(opts, function(res) {
    if (DEBUG) {
      console.log('STATUS: ' + res.statusCode);
      console.log('HEADERS: ' + JSON.stringify(res.headers));
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        console.log('BODY: ' + chunk);
      });
    }
    // Check for OK
    if (res.statusCode != 200) {
      return false;
    }
    res.on('error', function(e) {
      if (DEBUG) { console.log("Error on Request: ' + e.message'"); }
    });
  });

  req.write(data);
  req.end();
}

//-------------------------------------------------------------------------------
// Function:  _sendSMS()
//   Send alert via SMS from IFTTT
//-------------------------------------------------------------------------------
function _sendSMS(topic, msg) {
  if (DEBUG) { console.log("_sendSMS(): topic=" + topic +" msg=" + msg); }
  var opts = {
    host: "maker.ifttt.com",
    port: 443,
    path: "/trigger/IoT_Alert2/with/key/{Your IFTTT Key Here}",
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  var g = topic.split('/');
  g.shift();
  var t = g.join('/');          // Take the "alert" off the start of the topic and use the rest as the sensor name

  var data = '{ "value1": "' + t + '", "value2": "' + msg + '" }';
  if (DEBUG) { console.log("PAYLOAD: " + data); }

  var req = https.request(opts, function(res) {
    if (DEBUG) {
      console.log('STATUS: ' + res.statusCode);
      console.log('HEADERS: ' + JSON.stringify(res.headers));
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        console.log('BODY: ' + chunk);
      });
    }
    // Check for OK
    if (res.statusCode != 200) {
      return false;
    }
    res.on('error', function(e) {
      if (DEBUG) { console.log("Error on Request: ' + e.message'"); }
    });
  });

  req.write(data);
  req.end();
}
