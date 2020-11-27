const mongoose = require('mongoose')
const UserDataSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    channels: {
        type: Array,
        required: false
    },
    notificationsEnabled: {
        type: Boolean,
        required: false
    }
})

const UserData = mongoose.model('UserData', UserDataSchema)

module.exports = UserData