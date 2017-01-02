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
    var long_url = req.url.slice(5); // slice first 5 char ('/new/') from input_url.

    if (validURL.isUri(long_url)) {

        // try with a query (not a promise, but does have a '.then()').
        var longURLQuery = url.findOne({"longURL": long_url});

        longURLQuery.then(function(docLong) {

            if(docLong) {

                // find the largest shortURL

                if (docLong.longURL === long_url) {
                    res.send("long_url already exists in db. it's short_url is " + docLong.shortURL);
                } 

            } else {

                var largestShortURLQuery = url.find().sort({"shortURL": -1}).limit(1);

                largestShortURLQuery.then(function(docLargest) {
                    if (docLargest) {

                        var largestShortURL = docLargest[0].shortURL;

                        var newShortURL = largestShortURL + 1;

                        var newURLObject = new url({
                            shortURL: newShortURL,
                            longURL: long_url
                        });

                        newURLObject.save(function(err) {
                            if(err) {
                                res.send(err);
                            } else {
                                res.send("new url added.\nobject: " + newURLObject);
                            }
                        });

                    } else {
                        res.send("Error: " + err);
                    }
                });
            }
        });
    } else {
        res.send("invalid url: " + long_url);
    }
});

// short_url
app.get('/:input_id', function(req,res) {
    var short_url = req.url.slice(1);

    var urlShortPattern = /^\d+$/;

    if (urlShortPattern.test(short_url)) {

        // try with a query (not a promise, but does have a '.then()').
        var shortURLQuery = url.findOne({"shortURL": short_url});

        shortURLQuery.then(function(docShort) {

            if (docShort) {
                res.send("short url " + docShort.shortURL + " found. redirecting to " + docShort.longURL);
            }

        });

    } else {
        res.send('not a valid short url. try again. input_url: ' + short_url);
    }
});



// start server
app.listen(port);
console.log('server started on port ' + port);
