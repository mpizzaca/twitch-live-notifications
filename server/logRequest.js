module.exports = (req, res, next) => {
    console.log('\x1b[47m\x1b[30m%s\x1b[0m%s', '[' + new Date().toLocaleTimeString() + ']', ' ' + req.method + ' ' + req.path )
    next()
}