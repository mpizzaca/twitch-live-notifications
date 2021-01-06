const mongoose = require('mongoose')
const Keys = new mongoose.Schema({
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
}, { _id: false })
const PushSubscription = new mongoose.Schema({
    endpoint: { type: String, required: true },
    expirationTime: { type: Date, required: false },
    keys: { type: Keys, required: true }
}, { _id: false })
const UserDataSchema = new mongoose.Schema({
    username: { type: String, required: true },
    channels: { type: Array, required: false },
    notificationsEnabled: { type: Boolean, default: null },
    webpushSubscription: { type: PushSubscription, default: null }
})

const UserData = mongoose.model('UserData', UserDataSchema)

module.exports = UserData