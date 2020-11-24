// npm modules
const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const LogRequest = require('./logRequest')

const secrets = require('./secrets')
const dbUrl = 'mongodb://localhost:27017/mydb'
const dbName = 'twitch-live-notifications-db'

// create the server
const app = express();

// add & configure middleware
app.use(express.json())
app.use(LogRequest)
app.use(session({
    secret: secrets.expressSessionSecret,
    resave: false,
    saveUninitialized: true,
}))

// configure mongoose
mongoose.connect(dbUrl, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})

/*********************/
//     ENDPOINTS     //
/*********************/
// create homepage route at '/'
app.get('/', (req,res) => {
    res.send('homepage');
})

app.get('/login', (req, res) => {
    console.log('GET /login');
    console.log('req.sessionID: ' + req.sessionID);
    res.send('login page');
})

app.post('/login', (req,res) => {
    
    res.send('default login response')
})

    

app.post('/register', (req,res) => {

    res.send('default registration response')
})



// start the server
app.listen(process.env.PORT || 3005, () => {
    console.log('Listening on localhost:3005');
})