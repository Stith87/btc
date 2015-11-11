var Client = require('coinbase').Client;
var client = new Client({'a});
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
var currentPrice  // Current BTC Price in USD
var rsi;					// Relative Strength Index
var sma;					// Simple Moving Average

function priceCheck(price, date){
	this.price = price;
	
}

var getPrice = setInterval(function(){
	client.getBuyPrice({'currency': 'USD'}, function(err, obj) {
		
		var price = new priceCheck(parseFloat(obj.data.amount));

		var query = connection.query('INSERT INTO prices SET ?;  SELECT AVG(price) as average FROM prices limit 600; ', price, function(err, result){
			if(!err){				
				console.log();
				price.average = result[1][0].average;  //AVG of last 600 entries (roughly 10 minutes)
				price.difference = (1 - (price.average)/parseFloat(price.price)) * 100;
				console.log(price);
			} else {
				console.log(err);
			}
		})
		

	  //console.log('total amount: ' + obj.data.amount + );
	});
}, 5000)