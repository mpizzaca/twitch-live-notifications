const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const User = require('../models/Users')

module.exports = (passport) => {
    passport.use(
        new LocalStrategy((user, password, done) => {
            
            // match user
            User.findOne({ username: user })
            .then((user) => {
                if (!user) {
                    return done(null, false, { message: 'User is not registered'})
                }

                // match pass
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err

                    if (isMatch) {
                        return done(null, user)
                    } else {
                        return done(null, false, { message: 'Password incorrect'})
                    }
                })
            })
            .catch((err) => { console.log(err) })
        })
    )

    passport.serializeUser((user, done) => {
        console.log('passport.serializeUser user: ' + user)
        done(null, user.id)
    })

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user)
        })
    })
}