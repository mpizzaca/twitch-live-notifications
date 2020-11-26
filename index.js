// npm modules
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const mongoose = require('mongoose')
const passport = require('passport')
const LogRequest = require('./logRequest')
const User = require('./models/Users')
const bcrypt = require('bcrypt')
const path = require('path')

var secrets;
if (process.env.NODE_ENV != 'production') secrets = require('./secrets')

const dbUrl = process.env.MONGODB_URL || secrets.MONGODB_URL

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
    res.render('home', { username: req.user?.username });
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
        console.log('after login')
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


// start the server
app.listen(process.env.PORT || 3005, () => {
    console.log('Listening on localhost:3005');
})