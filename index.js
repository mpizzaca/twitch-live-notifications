// npm modules
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;
const MongoStore = require('connect-mongo')(session);

// create the server
const app = express();

// add & configure middleware
app.use(session({
    genid: (req) => {
        console.log('Inside session middleware')
        console.log(req.sessionID)
        return uuidv4()
    },
    secret: 'asdjaiwd',
    resave: false,
    saveUninitialized: true
}))


// create homepage route at '/'
app.get('/', (req,res) => {
    console.log('Inside the homepage callback function')
    console.log(req.sessionID)
    res.send('homepage');
})

// start the server
app.listen(process.env.PORT || 3005, () => {
    console.log('Listening on localhost:3005');
})