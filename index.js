const Twit = require('twit');
const dgram = require('dgram');
const moment = require('moment');
const fs = require('fs');
const sentiment = require('sentiment');

function loadConfig() {
	let credentialsFromFile;
	let configFromFile;

	try {
		credentialsFromFile = JSON.parse(fs.readFileSync(__dirname + '/credentials.json', 'utf-8'));
		configFromFile = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf-8'));
	}
	catch(e) { }

	return {
		credentials: {
			consumer_key: process.env.TWITTER_CONSUMER_KEY || credentialsFromFile.consumer_key,
			consumer_secret: process.env.TWITTER_CONSUMER_SECRET || credentialsFromFile.consumer_secret,
			access_token: process.env.TWITTER_ACCESS_TOKEN || credentialsFromFile.access_token,
			access_token_secret: process.env.TWITTER_ACCESS_SECRET || credentialsFromFile.access_token_secret
		},
		config: {
			host: process.env.TWITTER_LOGSTASH_HOST || configFromFile.host,
			port: process.env.TWITTER_LOGSTASH_PORT || configFromFile.port,
			keywords:process.env.TWITTER_KEYWORDS || configFromFile.keywords
		}
	};
}

const allConfig = loadConfig();
const config = allConfig.config;
const credentials = allConfig.credentials;

console.log(`Sending tweets with keywords "${config.keywords}" to ${config.host}:${config.port}`)

const T = new Twit(credentials);

const socket = dgram.createSocket('udp4');

const stream = T.stream('statuses/filter', { track: config.keywords })

stream.on('tweet', function (tweet) {
	const logstash = {
		'@timestamp': moment(tweet.created_at).toISOString(),
		type: 'tweet',
		content: tweet.text,
		sentiment: sentiment(tweet.text),
		author: {
			name: tweet.user.name,
			handle: tweet.user.screen_name
		}
	};
	const message = new Buffer(JSON.stringify(logstash));

	socket.send(message, 0, message.length, config.port, config.host, function(err, bytes) {
		if(err) {
			console.log(err);
		}
		else {
			console.log('Tweet sent');
		}
	});
});
