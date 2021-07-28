var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var restAPI = require('./routes/restAPI');








var app = express();



app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Methods', 'GET')//, OPTIONS, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Origin', 'localhost');
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');



// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use('/restAPI', restAPI);



app.all('*', function(req, res) {
    throw new Error("Bad request")
});


app.use(function(e, req, res, next) {
    if (e.message === "Bad request") {
        res.status(400).json({status: 400});
    }
    else{
        res.status(500).json({status: 500});
    }
});







app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});


module.exports = app;
