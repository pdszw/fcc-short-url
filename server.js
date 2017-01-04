// vim: set tabstop=4 softtabstop=4 shiftwidth=4 expandtab:

// set to true to enable console logging. false to disable.
var DEBUG = true;

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
    DEBUG && console.log('got: nothing');
    res.sendFile('index.html');
    DEBUG && console.log('sent: index.html');
});

// get existing short url
app.get('/:input_id', function (req,res) {
    // make input_url into a base-10 int
    var shortURL = parseInt(req.params.input_id,10);
    DEBUG && console.log('got: short_url ' + shortURL);

    // if short_url is not-a-number,
    if (Number.isNaN(shortURL)) {
        DEBUG && console.log('short_url ' + shortURL + ' is not valid');
        // return error
        res.status(500).json({ "error": selfURL + req.params.input_id + " is not a valid short_url" });
        DEBUG && console.log('sent: invalid short_url error');
    // otherwise,
    } else {
        DEBUG && console.log('short_url ' + shortURL + ' is valid');

        // declare mongo query to find that short_url
        var shortURLQuery = url.findOne({"short_url": shortURL}).maxTime(10000);

        // try the query with a .then() (not a promise, but similar enough function for what we need).
        DEBUG && console.log('searching for short_url in db...');
        shortURLQuery.then(function(docShort) {
            // if document found,
            if (docShort) {
                // log to console that found and redirect to original_url.
                DEBUG && console.log("short url " + selfURL + "/" + docShort.short_url + " found. redirecting to " + docShort.original_url);
                res.redirect(docShort.original_url);
            // if document not found,
            } else {
                DEBUG && console.log('short_url ' + shortURL + ' not found');
                // return error stating that.
                res.status(500).json({ "error": "short_url " + selfURL + shortURL + " not found" });
                DEBUG && console.log('sent: short_url not found error');
            }
        });
    }
});

// add new long url
app.get('/new/:input_url*', function (req,res) {
    var newLongURL = req.url.slice(5);  // slice first 5 char ('/new/') from input_url
    DEBUG && console.log('got: long input_url ' + newLongURL);

    // if newLongURL is a valid URL
    if (validURL.isUri(newLongURL)) {
        DEBUG && console.log('long input_url ' + newLongURL + ' is valid');

        // declare mongo query to find if that url already exists in db
        var longURLQuery = url.findOne({"original_url": newLongURL}).maxTime(10000);

        // try the query (with not a promise but similar -- see above).
        DEBUG && console.log('searching for long_url in db...');
        longURLQuery.then(function(docLong) {
            // if document found (new url already exists in db),
            if (docLong) {
                DEBUG && console.log('found new url in db. sent json response.');
                res.status(500).json({ "original_url": docLong.original_url, "short_url": selfURL + docLong.short_url });
            // if document not found (new url not yet in db),
            } else {
                DEBUG && console.log('new url not found in db.');
                // declare mongo query to find largest short_url currently in db
                var largestShortURLQuery = url.find().sort({"short_url": -1}).limit(1).maxTime(10000);

                // and try the query
                DEBUG && console.log('finding largest short_url in db...');
                largestShortURLQuery.then(function(docLargestShort) {
                    // if document found (found largest short_url),
                    if (docLargestShort) {
                        DEBUG && console.log('found largest short_url');
    
                        var largestShortURL;

                        //if (docLargestShort[0].short_url) {
                        if (docLargestShort.length) {
                            DEBUG && console.log(docLargestShort);
                            DEBUG && console.log('and setting largestShortURL to value of docLargestShort[0].short_url');
                            largestShortURL = docLargestShort[0].short_url;
                            DEBUG && console.log('largestShortURL: ' + largestShortURL);
                        } else {
                            // just make it 0
                            DEBUG && console.log('and its undefined. setting it to zero.');
                            largestShortURL = 0;
                        }

                        // and make newShortURL 1 greater than largest current short_url
                        var newShortURL = largestShortURL + 1;
                        DEBUG && console.log('new largest short_url is: ' + newShortURL);

                        // declare new new url object to insert into db
                        var newURLObject = new url({
                            short_url: newShortURL,
                            original_url: newLongURL
                        });
                        DEBUG && console.log('created new object to insert into db: ' + newURLObject);

                        // and save it in db
                        newURLObject.save(function(err) {
                            if (err) {
                                DEBUG && console.log('could not save new object into db.');
                                res.status(500).json({ "error": err });
                            } else {
                                DEBUG && console.log('saved new object into db.');
                                res.json({ "original_url": newURLObject.original_url, "short_url": selfURL + newURLObject.short_url });
                                DEBUG && console.log('sent response to browser.');
                            }
                        });
                    // or if some error
                    } else {
                        DEBUG && console.log('some other error: ' + err);
                        res.status(500).json({ "error": err });
                    }
                });
            }
        }); 
    // if newLongURL is not valid
    } else {
        DEBUG && console.log('new input_url ' + newLongURL + ' is not valid');
        res.status(500).json({ "error": "URL " + newLongURL + " is not valid" });
    }

});

// routes END 

// start server
app.listen(port);
DEBUG && console.log('server started on port ' + port);
