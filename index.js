// npm modules
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const mongoose = require('mongoose')
const passport = require('passport')
const LogRequest = require('./logRequest')
const User = require('./models/Users')
const bcrypt = require('bcrypt')

const secrets = require('./secrets')
const dbUrl = process.env.MONGODB_URL || secrets.MONGODB_URL
//const dbName = 'twitch-live-notifications-db'

require('./config/passport')(passport)

// configure mongoose
mongoose.connect(dbUrl, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})

// create the server
const app = express();

// add & configure middleware
app.use(express.json())
app.use(LogRequest)
app.use(session({
    secret: secrets.expressSessionSecret,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore ({ mongooseConnection: mongoose.connection })
}))
app.use(passport.initialize())
app.use(passport.session())



//*******************//
//     ENDPOINTS     //
//*******************//
app.get('/', (req,res) => {
    res.send('homepage');
})

app.get('/login', (req, res) => {
    res.send('login page');
})

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err) }
        if (!user) { 
            // authentication failed
            console.log('login for ' + req.body.username + ' failed: ' + JSON.stringify(info))
            return res.redirect('/login') 
        }

        req.login(user, err => {
            if (err) throw err
            
        })

        return res.send('login successful')
    })(req, res, next)
})

app.post('/register', (req,res) => {

    const { username, password } = req.body
    let errors = []

    if (!username || !password) { errors.push({ msg: 'All fields are required'}) }
    if (password.length < 7) { errors.push({ msg: 'Password must be at least 7 characters'}) }

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


// start the server
app.listen(process.env.PORT || 3005, () => {
    console.log('Listening on localhost:3005');
})