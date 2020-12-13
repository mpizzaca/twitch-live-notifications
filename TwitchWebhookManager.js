var request = require('request')
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
}

module.exports = TwitchWebhookManager