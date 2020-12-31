// npm modules
const express = require('express')
const webpush = require('web-push')
const favicon = require('serve-favicon')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const mongoose = require('mongoose')
const passport = require('passport')
const LogRequest = require('./logRequest')
const User = require('./models/Users')
const UserData = require('./models/UserData')
const Channel = require('./models/Channel')
const bcrypt = require('bcrypt')
const path = require('path')
const NotificationManager = require('./NotificationManager')
const TwitchWebhookManager = require('./TwitchWebhookManager')
require('./config/passport')(passport)

let TWITCH_API_LEASE_SECONDS 

if (process.env.NODE_ENV != 'production') TWITCH_API_LEASE_SECONDS = 30
else TWITCH_API_LEASE_SECONDS = 300

// setup dev environment
var secrets;
if (process.env.NODE_ENV != 'production') {
    secrets = require('./secrets')
    //mongoose.set('debug', true)
}
// configure mongoose
const dbUrl = process.env.MONGODB_URL || secrets.MONGODB_URL
mongoose.connect(dbUrl, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
// set NotificationManager, TwitchWebhookManager
const notificationManager = new NotificationManager(webpush)
const twitchWebhookManager = new TwitchWebhookManager(TWITCH_API_LEASE_SECONDS)

// setup recurring webhook subscriptions (wait 10s before first, then run every time webhook expires)
setTimeout(() => {
    twitchWebhookManager.SubscribeToChannelUpdates()
    setInterval(() => {
        twitchWebhookManager.SubscribeToChannelUpdates()
    }, TWITCH_API_LEASE_SECONDS * 1000)
}, 10000)

// create the server
const app = express();

// add & configure middleware
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
try {
    app.use(favicon(path.join(__dirname, 'public', 'favicon', 'favicon.ico')))
} catch (err) {

}
app.use(express.urlencoded({ extended: true }))
app.use(LogRequest)
app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET || secrets.EXPRESS_SESSION_SECRET,
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

    if (req.isAuthenticated()) {
        UserData.findOne( {username: req.user.username }, (err, doc) => {
            if(doc) {
                // convert mongoose document to javascript object & stringify channels, can't do in pug
                doc = doc.toObject()
                doc.channels = doc.channels.join(',')

                res.render('home', { user: doc });
            } else if (err) {
                console.log('Error: ' + JSON.stringify(err))
            } else {
                // user is authenticated but no UserData exists -- somethings gone wrong
                console.log('Error on GET / : user is authenticated but no UserData could be found')
                console.log('req.user: ' + JSON.stringify(req.user))
            }
        })
    } else { 
        res.render('home');
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

                // create new UserData
                const newUserData = new UserData( { username }).save()
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

    // validate request / cleanup channels
    const tmp = req.body.channels
    var channels = []
    try {
        channels = tmp.replace(/[^A-Za-z0-9,]/g, '').toLowerCase().split(',').filter(ele => {
            return ele != null && ele != ""
        })
    } catch(e) {
        // handle errors
        console.log('error creating channels array: ' + e)
        res.render('home', { message: 'error updating channels' })
    }

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

app.get('/subscribe', (req, res) => {
    if(!req.isAuthenticated()) {
        return res.sendStatus(401)
    } else {
        UserData.findOne({ username: req.user.username }, (err, doc) => {
            if (err) { return res.sendStatus(400) }
            if (doc) { console.log(doc.webpushSubscription); return res.send(doc.webpushSubscription) }// || JSON.stringify({}))}
        })
    }
})

// User enabled notifications. 
// Request will contain WebPush subscription necessary to send the notification.
app.post('/subscribe', (req, res) => {
    if (req.isAuthenticated()) {
        console.log(JSON.stringify(req.body))

        const filter = { username: req.user.username }
        const update = { webpushSubscription: req.body.subscription, notificationsEnabled: req.body.notifications }

        UserData.findOneAndUpdate(filter, update, { new: true, useFindAndModify: false },
            (err, doc) => {
                if (doc && !err) {
                    // updated UserData object
                    //return res.send(doc)
                    console.log('doc: ' + JSON.stringify(doc))
                    return res.sendStatus(200)
                } else if (err) {
                    return res.status(400).send(err)
                }
        })

    } else {
        res.status(401).send()
    }
})

// send a test notification
app.post('/notify', (req, res) => {
    if (req.isAuthenticated()) {
        // find user's webpushSubscription & call notificationManager to trigger notification
        UserData.findOne( {username: req.user.username }, 'webpushSubscription', (err, doc) => {
            if (err) { res.status(400).send(err) }
            var payload = JSON.stringify({
                title: 'Congratulations!',
                body: 'Notifications are enabled!'
            })
            notificationManager.sendNotification(doc.webpushSubscription, payload)
            return res.redirect('/')
        })
    } else { res.status(401).send() }
})

app.get('/test', (req, res) => {
    twitchWebhookManager.SubscribeToChannelUpdates()
    return res.redirect('/')
})

app.get('/streams/*', (req, res) => {
    if (req.query['hub.challenge']) {
        // twitch API is confirming webhook - respond with challenge
        console.log('Webhook subscription confirmed for: ' + req.params['0'])
        return res.send(req.query['hub.challenge'])
    }
})

app.post('/streams/*', (req, res) => {
    let live = (req.body.data[0]?.type === 'live')
    let channelName = req.params['0']
    console.log('live: ' + live)

    Channel.findOne({ name: channelName }, (err, doc) => {
        if (err) {
            console.log('Error finding channel: ' + err)
            return res.send()
        } else {
            // debug: console.log('doc: ' + doc)
            if (live && !doc.live) {
                // channel just went live - send notification
                console.log(channelName + ' just went live, sending notifications')

                let payload = {
                    title: channelName + ' just went live!',
                    icon: doc.profile_image_url,
                    actions: [{ action: 'watch', title: 'Watch now!'}],
                    data: { url: 'http://twitch.tv/' + channelName }
                }
                payload = JSON.stringify(payload)

                UserData.find({ channels: channelName}, (err, res) => {
                    if (err) { return console.log('Error pulling UserData to send notifications: ' + err) }
                    res.forEach(doc => {
                        notificationManager.sendNotification(doc.webpushSubscription, payload)
                    })
                })
            } else if (!live && doc.live) { console.log(channelName + ' just went offline') }
            // update 'channels' live status
            Channel.findOneAndUpdate({ name: channelName }, { live: live }, { useFindAndModify: false }).exec()
            return res.send()
        }
    })
})


// start the server
app.listen(process.env.PORT || 3005, () => {
    if (process.env.PORT == undefined) console.log('Server is running on localhost:3005')
    else console.log('Server is running')
})