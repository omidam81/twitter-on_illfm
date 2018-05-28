"use strict";

const express = require('express');
const bodyParser = require('body-parser');

const app = express()
const config = require('./config.json');
const https = require('https');
const http = require('http');
const fs = require('fs');

const key = config.api.key;
const user = config.api.RegisteredTo;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));

function fetchData(callback) {
    http.get("http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=" + user + "&api_key=" + key + "&format=json", (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                //console.log(rawData);
                var currentTrack = {};
                var tracks = parsedData.recenttracks.track;

                for (let i = tracks.length - 1; i >= 0; i--) {
                    let t = tracks[i];
                    if (t['@attr'] && t['@attr'].nowplaying) {
                        currentTrack.name = t.name;
                        currentTrack.url = t.url;
                        currentTrack.artist = t.artist["#text"];
                    }
                }

                console.log(currentTrack);

            } catch (e) {
                console.error(e.message);
            }
        });
    });
}

var cron = require('node-cron');
var running = false;
cron.schedule('* 1 * * *', function() {
    if (running) return;
    running = true;
    fetchData(function() {
        running = false;
    })
});


https.createServer({}, app).listen(3000, () => {
    console.log(`Listening for Shopify webhook event data on port ${3000}. Started ${new Date().toString()}`);
});