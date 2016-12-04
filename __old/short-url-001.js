// vim: set tabstop=4 softtabstop=4 shiftwidth=4 expandtab: 


// load needed packages
var express = require('express');
var validURL = require('valid-url');
var mongoose = require('mongoose');

// use environment-defined port or 3000
var port = process.env.PORT || 3000;

// connect to urldb mongodb
mongoose.connect('mongodb://localhost:27017/urldb2');

// define url schema
var urlSchema = new mongoose.Schema({
   shortURL: Number,
   longURL: String
});

var url = mongoose.model('url', urlSchema);


// create express application
var app = express();

// no input_url
app.get('/', function(req,res) {
    res.send('not a long or short url. try again.');
});


// new long_url (needs asterisk after :input_url, or it cannot handle a 'http://',etc before the parameter. tries to GET the parameter.)
app.get('/new/:input_url*', function(req,res) {
    console.log("--- app.get('/new/:input_url*, function(req,res) --- ");
    var long_url = req.url.slice(5); // slice first 5 char ('/new/') from input_url.
    console.log('long_url is: ' + long_url);

    if (validURL.isUri(long_url)) {

        // try with a query (not a promise, but does have a '.then()').
        var longURLQuery = url.findOne({"longURL": long_url});
        console.log("--- var longURLQuery = url.findOne({'longURL': long_url}); ---");

        longURLQuery.then(function(docLong) {
            console.log("--- longURLQuery.then(function(docLong) { ---");

            if(docLong) {


                // find the largest shortURL
                console.log("--- longURLQuery.then(function(docLong) { -- if docLong ---");

                console.log("docLong is " + docLong + " docLong.longURL is " + docLong.longURL);

                if (docLong.longURL === long_url) {
                    console.log('--- if (docLong.longURL === long_url) { ---');
                    console.log('long_url already exists in db. its short_url is ' + docLong.shortURL);
                    res.send("long_url already exists in db. it's short_url is " + docLong.shortURL);
                } else {

                }

            } else {


                console.log("--- longURLQuery.then(function(docLong) { -- else ---");



                    var largestShortURLQuery = url.find().sort({"shortURL": -1}).limit(1);
                    console.log("--- var largestShortURLQuery = url.find().sort({'shortURL': -1}).limit(1) ---");

                    largestShortURLQuery.then(function(docLargest) {
                        if (docLargest) {


                            console.log("--- largestShortURLQuery.then(function(docLargest) { -- if docLargest ---");
                            console.log("largestShortURLQuery no error");

                            var largestShortURL = docLargest[0].shortURL;
                            console.log('largestShortURL is: ' + largestShortURL + ' and docLargest is ' + docLargest + ' and docLargest[0].shortURL is: ' + docLargest[0].shortURL);

                            var newShortURL = largestShortURL + 1;
                            console.log('largestShortURL is: ' + largestShortURL);
                            console.log('newShortURL is: ' + newShortURL);

                            var newURLObject = new url({
                                shortURL: newShortURL,
                                longURL: long_url
                            });
                            console.log("--- var newURLObject = new url(); ---");
                            console.log("newURLObject.shortURL is: " + newURLObject.shortURL + " and newURLObject.longURL is: " + newURLObject.longURL);

                            newURLObject.save(function(err) {
                                if(err) {
                                    console.log("--- newURLObject.save(function(err) { -- if err ---");
                                    console.log("error: " + err);
                                    res.send(err);
                                } else {
                                    console.log("--- newURLObject.save(function(err) { -- else ---");
                                    console.log("new url added. longURL: " + newURLObject.longURL + " and shortURL: " + newURLObject.shortURL);
                                    res.send("new url added.\nobject: " + newURLObject);
                                }
                            });

                        } else {

                            console.log("--- largestShortURLQuery.then(function(docLargest) { -- else ---");
                            console.log("error: " + err);
                            res.send("Error: " + err);
                        
                        }
                

                    });


            }
        });
    }
});

// short_url
app.get('/:input_id', function(req,res) {
    console.log("--- app.get('/:input_id', function(req,res) { --- ");
    var short_url = req.url.slice(1);
    //res.send('short_url: ' + short_url)
    console.log('short_url is: ' + short_url);

    var urlShortPattern = /^\d+$/;

    if (urlShortPattern.test(short_url)) {

        // try with a query (not a promise, but does have a '.then()').
        var shortURLQuery = url.findOne({"shortURL": short_url});
        console.log("--- var shortURLQuery = url.findOne({'shortURL': short_url}); ---");

        shortURLQuery.then(function(docShort) {
            console.log("--- shortURLQuery.then(function(docShort) { ---");

            if (docShort) {
                
                console.log("--- shortURLQuery.then(function(docShort) { -- if docShort ---");

                console.log("docShort is " + docShort + " docShort.longURL is " + docShort.longURL);

                console.log("short url " + docShort.shortURL + " found. redirecting to " + docShort.longURL);
                res.send("short url " + docShort.shortURL + " found. redirecting to " + docShort.longURL);

            }

        });

        //res.send('ShortURL input_url: ' + input_url);
    } else {
        console.log("--- if (urlShortPattern.test(short_url)) { -- else --- ");
        console.log('error: ' + err);
        console.log('invalid short_url. it is: ' + short_url);
        res.send('not a valid short url. try again. input_url: ' + short_url);
    }
});



// start server
app.listen(port);
console.log('server started on port ' + port);
