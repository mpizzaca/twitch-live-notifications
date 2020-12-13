var request = require('request');
const UserData = require('./models/UserData');
const Channels = require('./models/Channel');
var secrets;
if (process.env.NODE_ENV != 'production') secrets = require('./secrets')

class TwitchWebhookManager {

    TWITCH_API_TOKEN;

    HelixEndpoints = {
        GetSubscriptions: 'https://api.twitch.tv/helix/webhooks/subscriptions',
        Subscribe: 'https://api.twitch.tv/helix/webhooks/hub',
        Users: 'https://api.twitch.tv/helix/users',
        Token: 'https://id.twitch.tv/oauth2/token'
    }

    constructor() {
        // setup - get twitch token
        const options = {
            url: this.HelixEndpoints.Token,
            method: 'POST',
            json: true,
            qs: {
                client_id: process.env.TWITCH_CLIENT_ID || secrets.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET || secrets.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            },
        } 

        request(options, (err, res, body) => {
            if (err || res?.statusCode !== 200) console.log('TWM: error retrieving Twitch API token: ' + err)
            else {
                // Twitch API token retrieval was successful - save the token
                console.log('TWM: Twitch API token retreived succesfully: ' + JSON.stringify(body))
                this.TWITCH_API_TOKEN = body.access_token
            }
        })
    }


    // Subscribes to Twitch webhook updates for all subscribed-to channels
    // runs every 5 mins
    async SubscribeToChannelUpdates() {

        // Get all unique 'channels' from userdatas collection = newChannels
        var newChannels = await UserData.distinct('channels', (err, channels) => {
            if (err) console.log('TWM: error getting UserData channels: ' + JSON.stringify(err))
            console.log('newChannels: ' + JSON.stringify(channels))
        })

        // Get all channels from channels collection = oldChannels
        var oldChannels = await Channels.distinct('name', (err, channels) => {
            if (err) console.log('TWM: error getting oldChannels: ' + JSON.stringify(err))
            console.log('oldChannels: ' + JSON.stringify(channels))
        })

        // Compare newChannels and oldChannels to get:
        // a) removedChannels = in oldChannels, not in newChannels
        // b) addedChannels = not in oldchannels, in newChannels
        var removedChannels = []
        oldChannels.forEach(channel => {
            if (!newChannels.includes(channel)) removedChannels.push(channel)
        })
        console.log('removedChannels: ' + removedChannels)

        var addedChannels = []
        newChannels.forEach(channel => {
            if (!oldChannels.includes(channel)) addedChannels.push(channel)
        })
        console.log('addedChannels: ' + addedChannels)
        
        // Delete all documents from channels collection where channel in removedChannels
        Channels.deleteMany({ name: { $in: removedChannels }}, (err, res) => {
            if (err) console.log('TWM: error deleting removedChannels: ' + JSON.stringify(err))
            console.log('removedChannels mongo result n: ' + JSON.stringify(res.n))
        })
        // Insert new documents into channels collection where channel in addedChannels
        var addedChannelObjs = []
        addedChannels.forEach(channel => {
            addedChannelObjs.push({ name: channel, live: false })
        })
        Channels.insertMany(addedChannelObjs, (err, docs) => {
            if (err) console.log('TWM: error inserting addedChannels: ' + JSON.stringify(err))
            console.log('addedChannels mongo result: ' + JSON.stringify(docs))
        })
        
        // Pull stream data for addedChannels to save current live/non-live status
        
        

    }
}

module.exports = TwitchWebhookManager