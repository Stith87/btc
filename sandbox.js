var Client = require('coinbase').Client;
var client = new Client({
		'apiKey': '63eNVP7LxyzpDnwJ', 
		'apiSecret': 'V3gq3gNCGOTLucII4InUbRyNIyT1lHPp',
		'baseApiUri': 'https://api.sandbox.coinbase.com/v2/',
  	'tokenUri': 'https://api.sandbox.coinbase.com/oauth/token'
  });
var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'btc',
  multipleStatements: true,
  connectTimeout: 0
});

/* GLOBALS */
var accountID = '2aec4d62-9560-5285-a7b0-7b26842b874c';
var currentPrice  // Current BTC Price in USD
var rsi;					// Relative Strength Index
var sma;					// Simple Moving Average

function priceCheck(price, average, variance, deviation, upperLimit, lowerLimit ){
	this.price = price;
	this.average = average;
	this.variance = variance;
	this.deviation = deviation;
	this.upperLimit = upperLimit;
	this.lowerLimit = lowerLimit;
	console.log(this);
}

var getPrice = setInterval(function(){
	client.getBuyPrice({'currency': 'USD'}, function(err, obj) {
		
		price = {};
		price.price = parseFloat(obj.data.amount);
 		console.log(price.price);
		var query = connection.query('SELECT AVG(price) as average FROM sandbox ORDER BY date DESC LIMIT 1200;', function(err, result){
			if(!err){				
				
				price.average = parseFloat(result[0].average);  //AVG of last 600 entries (roughly 10 minutes)
				price.variance = parseFloat(Math.pow(parseFloat(price.price) - parseFloat(price.average),2));
				
				var insertPrice = connection.query('INSERT INTO sandbox(price, variance) VALUES('+price.price+',' + price.variance + '); SELECT AVG(variance) as avgVariance from sandbox ORDER BY date DESC LIMIT 1200;', price, function(err,result){
					if(!err){
						price.deviation = parseFloat(Math.sqrt(result[1][0].avgVariance));
						price.upperLimit = parseFloat(price.average) + parseFloat(price.deviation);
						price.lowerLimit = parseFloat(price.average) - parseFloat(price.deviation);
						var currentPrice = new priceCheck(price.price, price.average, price.variance, price.deviation, price.upperLimit, price.lowerLimit);
					} else {
						console.log('error in insertPrice: ' + err);
					}

				});
				

			} else {
				console.log(err);
			}
		});


	})
}, 5000);

function sellCoin(amount, currency){

	client.getAccount(accountID, function(err, account) {
		
		var args = {
		  "amount": amount,
		  "currency": "BTC"
		};

		account.sell(args, function(err, xfer) {
			console.log('my xfer id is: ' + xfer);
		});

	  
	});
  
};

function buyCoin(amount, currency){
	client.getAccount(accountID, function(err, account) {
		
		var args = {
		  "amount": amount,
		  "currency": "BTC"
		};

		account.buy(args, function(err, xfer) {
			console.log('my xfer id is: ' + xfer);
		});

	  
	});
}

buyCoin('.01', 'BTC');