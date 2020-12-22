const { Int32 } = require('mongodb')
const mongoose = require('mongoose')

const ChannelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    live: { type: Boolean, required: true },
    user_id: { type: Number, required: false }
})

const Channel = mongoose.model('Channel', ChannelSchema)
module.exports = Channel