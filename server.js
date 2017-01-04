// vim: set tabstop=4 softtabstop=4 shiftwidth=4 expandtab:

// needed for those process.env variables
require('dotenv').config();

// load needed packages
var express = require('express');
var mongoose = require('mongoose');
var validURL = require('valid-url');

// use environment-defined port or 3000
var port = process.env.PORT || 3000;

// get selfURL from process.env
var selfURL = process.env.APP_URL + ':' + port + '/' || 'http://localhost:' + port + '/';

// create express application
var app = express();

// define where static files are kept (in same dir as this file). needed for 'res.sendFile'.
app.use(express.static(__dirname));


// db START

mongoose.connect('mongodb://localhost:27017/urldb');

// define urldb schema
var urlSchema = new mongoose.Schema({ 
    original_url: String,
    short_url: Number
});

var url = mongoose.model('url', urlSchema);

// db END


// routes START

// no input_url
app.get('/', function (req,res) {
    res.sendFile('index.html');
});

// get existing short url
app.get('/:input_id', function (req,res) {
    // make input_url into a base-10 int
    var shortURL = parseInt(req.params.input_id,10);

    // if short_url is not-a-number,
    if (Number.isNaN(shortURL)) {
        // return error
        res.status(500).json({ "error": selfURL + req.params.input_id + " is not a valid short_url" });
    // otherwise,
    } else {
        // declare mongoose query to find that short_url
        var shortURLQuery = url.findOne({"short_url": shortURL}).maxTime(10000);

        // try the query with a .then() (not a promise, but similar enough function for what we need).
        shortURLQuery.then(function(docShort) {
            // if document found,
            if (docShort) {
                // found short_url, redirect to original_url.
                res.redirect(docShort.original_url);
            // if document not found,
            } else {
                // return error stating that.
                res.status(500).json({ "error": "short_url " + selfURL + shortURL + " not found" });
            }
        });
    }
});

// add new long url
app.get('/new/:input_url*', function (req,res) {
    var newLongURL = req.url.slice(5);  // slice first 5 char ('/new/') from input_url

    // if newLongURL is a valid URL
    if (validURL.isUri(newLongURL)) {
        // declare mongoose query to find if that url already exists in db
        var longURLQuery = url.findOne({"original_url": newLongURL}).maxTime(10000);

        // try the query (with not a promise but similar -- see above).
        longURLQuery.then(function(docLong) {
            // if document found (new url already exists in db),
            if (docLong) {
                res.status(500).json({ "original_url": docLong.original_url, "short_url": selfURL + docLong.short_url });
            // if document not found (new url not yet in db),
            } else {
                // declare mongo query to find largest short_url currently in db
                var largestShortURLQuery = url.find().sort({"short_url": -1}).limit(1).maxTime(10000);

                // and try the query
                largestShortURLQuery.then(function(docLargestShort) {
                    // if document found (found largest short_url),
                    if (docLargestShort) {
                        var largestShortURL;

                        //if (docLargestShort is not empty or null) {
                        if (docLargestShort.length) {
                            largestShortURL = docLargestShort[0].short_url;
                        } else {
                            largestShortURL = 0;
                        }

                        // and make newShortURL 1 greater than largest current short_url
                        var newShortURL = largestShortURL + 1;

                        // declare new new url object to insert into db
                        var newURLObject = new url({
                            short_url: newShortURL,
                            original_url: newLongURL
                        });

                        // and save it in db
                        newURLObject.save(function(err) {
                            if (err) {
                                res.status(500).json({ "error": err });
                            } else {
                                res.json({ "original_url": newURLObject.original_url, "short_url": selfURL + newURLObject.short_url });
                            }
                        });
                    // or if some error
                    } else {
                        res.status(500).json({ "error": err });
                    }
                });
            }
        }); 
    // if newLongURL is not valid
    } else {
        res.status(500).json({ "error": "URL " + newLongURL + " is not valid" });
    }

});

// routes END 

// start server
app.listen(port);
