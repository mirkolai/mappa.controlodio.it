var express = require('express');
var router = express.Router();
var db = require('../db');



/* GET Frequency. */


/*exports.GET = function(req, res) {
    db.getRecords("San Francisco", function(err, results) {
        if(err) { res.send(500,"Server Error"); return;
            // Respond with results as JSON
            res.send(results);
        });
};*/

router.get('/levelOfAttribute/', function(req, res, next) {



    db.getLevelOfAttribute(function (err, result) {


        //you might want to do something is err is not null...
        res.send(result);

    },req);



});



router.get('/timeFrequency/', function(req, res, next) {



    db.getTimeFrequency(function (err, result) {


        //you might want to do something is err is not null...
        res.send(result);

    },req);



});



router.get('/virality/', function(req, res, next) {



    db.getVirality(function (err, result) {


        //you might want to do something is err is not null...
        res.send(result);

    },req);



});



router.get('/avg/', function(req, res, next) {



    db.getAvg(function (err, result) {


        //you might want to do something is err is not null...
        res.send(result);

    },req);



});



router.get('/median/', function(req, res, next) {



    db.getMedian(function (err, result) {


        //you might want to do something is err is not null...
        res.send(result);

    },req);



});


router.get('/minmax/', function(req, res, next) {



    db.getMinMax(function (err, result) {


        //you might want to do something is err is not null...
        res.send(result);

    },req);



});



router.get('/tokenfrequency/', function(req, res, next) {



    db.getTokenFrequency(function (err, result) {


        //you might want to do something is err is not null...
        res.send(result);

    },req);



});


router.get('/tokencorrelation/', function(req, res, next) {



    db.getTokenCorrelation(function (err, result) {


        //you might want to do something is err is not null...
        res.send(result);

    },req);



});



module.exports = router;
