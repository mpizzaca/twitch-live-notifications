// npm modules
const express = require('express')
const webpush = require('web-push')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const mongoose = require('mongoose')
const passport = require('passport')
const LogRequest = require('./logRequest')
const User = require('./models/Users')
const UserData = require('./models/UserData')
const bcrypt = require('bcrypt')
const path = require('path')
const NotificationManager = require('./NotificationManager')

require('./config/passport')(passport)

// setup secrets
var secrets;
if (process.env.NODE_ENV != 'production') secrets = require('./secrets')

// configure mongoose
const dbUrl = process.env.MONGODB_URL || secrets.MONGODB_URL
mongoose.connect(dbUrl, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})

// set up Web Push VAPID details
const notificationManager = new NotificationManager(webpush)

// create the server
const app = express();

// add & configure middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(LogRequest)
app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET || secrets.expressSessionSecret,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore ({ mongooseConnection: mongoose.connection })
}))
app.use(passport.initialize())
app.use(passport.session())

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))



//*******************//
//     ENDPOINTS     //
//*******************//
app.get('/', (req,res) => {

    var channels;

    if (req.isAuthenticated()) {
        UserData.findOne( {username: req.user.username }, (err, doc) => {
            if(doc) {
                console.log('found one: ' + JSON.stringify(doc))
                channels = doc.channels.join(',')
                res.render('home', { username: req.user?.username, channels: channels });
            } else {
                res.render('home', { username: req.user?.username });
            }
        })
    } else { 
        res.render('home', { username: req.user?.username });
    }

})

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err) }
        if (!user) { 
            // authentication failed
            console.log('login for ' + req.body.username + ' failed: ' + JSON.stringify(info))
            return res.render('login', { fail: true, message: info.message })
        }

        req.login(user, err => {
            if (err) throw err
            res.redirect('/')
        })
    })(req, res, next)
})

app.get('/register', (req, res) => {
    if (req.isAuthenticated()) res.redirect('/')

    res.render('register')
})

app.post('/register', (req,res) => {

    console.log('req.body: ' + JSON.stringify(req.body))

    const { username, password } = req.body
    let errors = []

    if (!username || !password) { errors.push({ msg: 'All fields are required'}) }
    if (password?.length < 7) { errors.push({ msg: 'Password must be at least 7 characters'}) }

    if (errors.length > 0) {
        return res.send(errors)
    } else {
        User.findOne({ username: username}).exec((err, user) => {
            if(user) {
                errors.push({ msg: 'Username already in use'})
                return res.send(errors + user)
            } else {
                // new user
                const newUser = new User({
                    username,
                    password
                })

                // hash password
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err
                        newUser.password = hash
                        newUser.save()
                        .then(value => {
                            res.redirect('/login')
                        })
                        .catch( value => console.log(value) )
                        
                    })
                })
            }
        })
    }
})

app.get('/user/:username', (req, res) => {
    if (req.isAuthenticated() && req.user.username === req.params.username) {
        res.send('this is your private profile')
    } else {
        res.status(401).send('you are not authorized to view this page')
    }
})

app.get('/logout', (req, res) => {
    if (req.isAuthenticated()) { req.logout() }
    res.redirect('/');
})

app.get('/channels', (req, res) => {
    //todo
})

app.post('/channels', (req, res) => {
    // authenticate
    if (!req.isAuthenticated()) res.status(401).send()

    // debug
    console.log('req.body: ' + JSON.stringify(req.body))

    // validate request
    const tmp = req.body.channels
    var channels = []
    try {
        channels = tmp.replace(/[^A-Za-z0-9,]/g, '').toLowerCase().split(',').filter(ele => {
            return ele != null && ele != ""
        })
    } catch(e) {
        // handle errors
        console.log('error creating channels array: ' + e)
        res.render('/', { message: 'error updating channels' })
    }

    // debug
    console.log('channels[]: ' + JSON.stringify(channels))

    const filter = { username: req.user.username }
    const update = { channels: channels }

    // create/update UserData
    UserData.findOneAndUpdate(filter, update, { new: true, useFindAndModify: false }, 
        (err, doc) => {
            if (!err && doc) {
                // updated UserData channels
                res.redirect('/')
            } else if (!err && !doc) {
                // save new UserData document
                new UserData({
                    username: req.user.username,
                    channels
                }).save().then(newDoc => {
                    res.redirect('/')
                })
            } else {
                // handle error
                console.log('error finding/updating UserData channels: ' + err)
                res.render('home', { message: 'error updating channels'})
            }
    })
})


// start the server
app.listen(process.env.PORT || 3005, () => {
    console.log('Listening on localhost:3005');
})