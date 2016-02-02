var Twit = require('twit');
var dgram = require('dgram');
var moment = require('moment');
var fs = require('fs');
var sentiment = require('sentiment');

var credentialData = fs.readFileSync(__dirname + '/credentials.json', 'utf-8');
var config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf-8'));
var credentials = JSON.parse(credentialData);

console.log(`Sending tweets with keywords "${config.keywords}" to ${config.host}:${config.port}`)

var T = new Twit(credentials);

var socket = dgram.createSocket('udp4');

var stream = T.stream('statuses/filter', { track: config.keywords })

stream.on('tweet', function (tweet) {
	var logstash = {
		'@timestamp': moment(tweet.created_at).toISOString(),
		type: 'tweet',
		content: tweet.text,
		sentiment: sentiment(tweet.text),
		author: {
			name: tweet.user.name,
			handle: tweet.user.screen_name
		}
	};
	var message = new Buffer(JSON.stringify(logstash));

	socket.send(message, 0, message.length, config.port, config.host, function(err, bytes) {
		if(err) {
			console.log(err);
		}
		else {
			console.log('Tweet sent');
		}
	});
});
