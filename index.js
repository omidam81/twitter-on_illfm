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
        conole.log(res);
        callback();
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