"use strict";

const express = require('express');
const bodyParser = require('body-parser');

const app = express()
const config = require('./config.json');
const https = require('https');
const http = require('http');
const fs = require('fs');
const shortid = require('shortid')


const Twitter = require('twitter');

const client = new Twitter({
    consumer_key: config.twitter.consumer_key,
    consumer_secret: config.twitter.consumer_secret,
    access_token_key: config.twitter.access_token_key,
    access_token_secret: config.twitter.access_token_secret
});


//setting up db

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)



const key = config.api.key;
const user = config.api.RegisteredTo;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));

function postTweet(track, callback) {
    let tweetStrint = `#nowplaying http://on-ill.fm/ \r\n${track.artist} - ${track.name}`;
    console.error(tweetStrint);

    client.post('statuses/update', { status: tweetStrint }, function(error, tweet, response) {
        if (callback) callback();
    });
}
var currentTrack = {};

var oldTrack = {};

function fetchData(callback) {
    http.get("http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=" + user + "&api_key=" + key + "&format=json", (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                //console.log(rawData);
                var tracks = parsedData.recenttracks.track;

                for (let i = tracks.length - 1; i >= 0; i--) {
                    let t = tracks[i];
                    if (t['@attr'] && t['@attr'].nowplaying) {
                        currentTrack.name = t.name;
                        currentTrack.url = t.url;
                        currentTrack.artist = t.artist["#text"];
                    }
                }
                if (currentTrack.name) {
                    if (oldTrack.name != currentTrack.name) {
                        postTweet(currentTrack, function() {
                            oldTrack = currentTrack;
                            if (callback) callback();
                        });
                    } else {
                        if (callback) callback();
                    }
                }
                //console.log(currentTrack);

            } catch (e) {
                console.error(e.message);
                if (callback) callback();
            }
        });
    });
}

var cron = require('node-cron');
var running = false;

/*var hskey = fs.readFileSync(config.config.hskeyPath);
var hscert = fs.readFileSync(config.config.hscert);

var options = {
    key: hskey,
    cert: hscert
};*/



cron.schedule('* * * * *', function() {
    console.log("im here");
    if (running) return;
    running = true;
    fetchData(function() {
        running = false;
    });
});
app.get("/", (req, res) => {
    res.send("hi it works!");
});

app.get("/getrecenttracks", (req, res) => {
    res.json(currentTrack);
});

http.createServer(app).listen(3001, () => {
    console.log(`Listening for event data on port ${3001}. Started ${new Date().toString()}`);
});