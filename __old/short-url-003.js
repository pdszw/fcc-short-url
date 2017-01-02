// vim: set tabstop=4 softtabstop=4 shiftwidth=4 expandtab:


// THAT FIND LARGEST SHORT URL QUERY FAILS IF STARTING FROM A BLANK DB.
// NEED TO RE-WRITE THAT PART (AND PREFERABLY WITHOUT SEED DATA).

// load needed packages
var express = require('express');
var mongoose = require('mongoose');
var validURL = require('valid-url');

// use environment-defined port or 3000
var port = process.env.PORT || 3000;

// create express application
var app = express();


// db START

// connect to urldb mongo db
// CHANGE TO URLDB!
mongoose.connect('mongodb://localhost:27017/urldb2');

// define urldb schema
var urlSchema = new mongoose.Schema({
    short_url: Number,
    original_url: String
});

var url = mongoose.model('url', urlSchema);

// db END

// seed data START


var seedURLObject = new url({
    short_url: 1,
    original_url: "http://www.google.com/"
});

// and save it in db
seedURLObject.save(function(err) {
    if (err) {
        res.status(500).send("error: " + err);
    } else {
        res.send("new url added to db.\nobject: " + newURLObject);
    }
});

// seed data END

// routes START

// no input_url
app.get('/', function (req,res) {
    res.send('not a long or short url. try again'); 
});

// get existing short url
app.get('/:input_id', function (req,res) {
    // make input_url into a base-10 int
    var shortURL = parseInt(req.params.input_id,10);

    // if short_url is not-a-number,
    if (Number.isNaN(shortURL)) {
        // return error
        res.status(404).send('not a valid short url');
    // otherwise,
    } else {
        // declare mongo query to find that short_url
        var shortURLQuery = url.findOne({"short_url": shortURL});

        // try the query with a .then() (not a promise, but similar enough function for what we need).
        shortURLQuery.then(function(docShort) {
            // if document found,
            if (docShort) {
                // log to console that found and redirect to original_url.
                console.log("short url " + docShort.short_url + " found. redirecting to " + docShort.original_url);
                res.redirect(docShort.original_url);
            // if document not found,
            } else {
                // return error stating that.
                res.status(404).send('short url not found');
            }
        });
    }
});

// add new long url
app.get('/new/:input_url*', function (req,res) {
//    var newLongURL = req.params.input_url;
    var newLongURL = req.url.slice(5);  // slice first 5 char ('/new/') from input_url
    console.log('long input_url: ' + newLongURL);

    // if newLongURL is a valid URL
    if (validURL.isUri(newLongURL)) {
        // declare mongo query to find if that url already exists in db
        var longURLQuery = url.findOne({"original_url": newLongURL});

        // try the query (with not a promise but similar -- see above).
        longURLQuery.then(function(docLong) {
            // if document found (new url already exists in db),
            if (docLong) {
                res.status(500).send("new url already in db. its short_url is " + docLong.short_url);
            // if document not found (new url not yet in db),
            } else {
                // declare mongo query to find largest short_url currently in db
                var largestShortURLQuery = url.find().sort({"short_url": -1}).limit(1);

                // and try the query
                largestSHortURLQuery.then(function(docLargestShort) {
                    // if document found (found largest short_url),
                    if (docLargest) {
                        // take (found) largest current short_url
                        var largestShortURL = docLargest[0].short_url;
                        // and make new short_url 1 larger
                        var newShortURL = largestShortURL + 1;        

                        // declare new new url object to insert into db
                        var newURLObject = new url({
                            short_url: newShortURL,
                            original_url: newLongURL
                        });

                        // and save it in db
                        newURLObject.save(function(err) {
                            if (err) {
                                res.status(500).send("error: " + err);
                            } else {
                                res.send("new url added to db.\nobject: " + newURLObject);
                            }
                        });
                    // or if some error
                    } else {
                        res.status(500).send("error: " + err);
                    }
                });
            }
        }); 
    // if newLongURL is not valid
    } else {
        res.status(500).send("invalid url: " + newLongURL);
    }
});

// routes END 


// start server
app.listen(port);
console.log('server started on port ' + port);
