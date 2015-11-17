var Client = require('coinbase').Client;
var client = new Client({});
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
var accountID = '96633089-99d7-5559-a902-69eceab6064a'
var currentPrice  // Current BTC Price in USD
var rsi;					// Relative Strength Index
var sma;					// Simple Moving Average

function priceCheck(price, average, variance, deviation, upperLimit, lowerLimit, maxPrice, minPrice ){
	this.price = price;
	this.average = average;
	this.variance = variance;
	this.deviation = deviation;
	this.upperLimit = upperLimit;
	this.lowerLimit = lowerLimit;
	this.maxPrice = maxPrice;
	this.minPrice = minPrice;
	console.log(this);
}

var getPrice = setInterval(function(){
	client.getBuyPrice({'currency': 'USD'}, function(err, obj) {
		if(!err &&obj.data){
			price = {};
			price.price = parseFloat(obj.data.amount);

			var query = connection.query('SELECT AVG(a.price) as average FROM (SELECT price FROM prices ORDER BY date DESC LIMIT 18000) a;', function(err, result){
				if(!err){				
					
					price.average = parseFloat(result[0].average);  //AVG of last 600 entries (roughly 10 minutes)
					price.variance = parseFloat(Math.pow(parseFloat(price.price) - parseFloat(price.average),2));
					
					var insertPrice = connection.query('INSERT INTO prices (price, variance) VALUES('+price.price+',' + price.variance + '); SELECT AVG(variance) as avgVariance from prices ORDER BY date DESC LIMIT 86400; SELECT MAX(PRICE) as maxPrice from prices LIMIT 60000; SELECT MIN(PRICE) as minPrice from prices LIMIT 86400;', price, function(err,result){
						if(!err){
							price.deviation = parseFloat(Math.sqrt(result[1][0].avgVariance));
							price.upperLimit = parseFloat(price.average) + parseFloat(price.deviation);
							price.lowerLimit = parseFloat(price.average) - parseFloat(price.deviation);
							price.maxPrice = parseFloat(result[2][0].maxPrice);
							price.minPrice = parseFloat(result[3][0].minPrice);
							currentPrice = new priceCheck(price.price, price.average, price.variance, price.deviation, price.upperLimit, price.lowerLimit, price.maxPrice, price.minPrice);

							comparePrice(price.price, price.lowerLimit, price.upperLimit, price.minPrice, price.maxPrice);
						} else {
							console.log(err);
						}
					});
				} else {
					console.log(err);
				}
			});

		}
		


	})

console.log(currentPrice);
}, 5000);

//Compares current price to limit prices
function comparePrice(current, lower, higher, min, max){
	if(current < lower){
		console.log('Current price is '+ parseFloat(((current-lower)/current)*100).toFixed(2) + '%  lower than the lower limit price');
	} 
	if(current < lower && current > min){
		console.log('Current price is '+ parseFloat(((current-lower)/current)*100).toFixed(2) + '% below lower Limit price and '+ parseFloat(((current-minimum)/current)*100).toFixed(2) + ' above minimum');

		
	}
	if(current > lower && current < higher){
		console.log('Current price is '+ parseFloat(((current-lower)/current)*100).toFixed(2) +'% above the lower limit and '+ + parseFloat(((current-higher)/current)*100).toFixed(2) + '% below the higher limit.');
	}
	if(current > higher){
		console.log('Current price is '+ parseFloat(((current-higher)/current)*100).toFixed(2) + '% above the higher limit price');
	}
	if(current > higher && current < max){
		console.log('Current Price is '+ parseFloat(((current-higher)/current)*100).toFixed(2) + ' above the higher limit price and '+ parseFloat(((current-max)/current)*100).toFixed(2) + '% below the maximum');
	}
}
function checkBalance(accountID){

}
function buyCoin(amount){

}

	client.getAccounts({}, function(err, accounts) {
	  accounts.forEach(function(acct) {
	  	console.log(acct);
	    console.log('my bal: ' + acct.balance.amount + ' for ' + acct.name);
	  });
	});

