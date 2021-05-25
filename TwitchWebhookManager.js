const request = require("request");
const axios = require("axios").default;
const util = require("util");
const UserData = require("./models/UserData");
const Channels = require("./models/Channel");

class TwitchWebhookManager {
  TWITCH_API_LEASE_SECONDS;
  NGROK_URL;

  HELIX_ENDPOINTS = {
    GetSubscriptions: "https://api.twitch.tv/helix/webhooks/subscriptions",
    Subscribe: "https://api.twitch.tv/helix/webhooks/hub",
    Users: "https://api.twitch.tv/helix/users",
    Streams: "https://api.twitch.tv/helix/streams",
    SearchChannels: "https://api.twitch.tv/helix/search/channels",
    Token: "https://id.twitch.tv/oauth2/token",
  };

  TwitchHeaders = {
    "Client-ID": process.env.TWITCH_CLIENT_ID,
  };

  constructor(leaseSeconds) {
    this.TWITCH_API_LEASE_SECONDS = leaseSeconds;

    // 1) Get Twitch API token to authenticate future requests
    // 1.a) setup options
    const options = {
      url: this.HELIX_ENDPOINTS.Token,
      method: "POST",
      json: true,
      qs: {
        client_id: process.env.TWITCH_CLIENT_ID || secrets.TWITCH_CLIENT_ID,
        client_secret:
          process.env.TWITCH_CLIENT_SECRET || secrets.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
      },
    };
    // 1.b) send request
    request(options, (err, res, body) => {
      if (err) console.log("TWM: error retrieving Twitch API token: " + err);
      else if (res?.statusCode !== 200)
        console.log(
          "TWM: issue retrieving Twitch API token: " + JSON.stringify(res)
        );
      else {
        // 1.c) Twitch API token retrieval was successful - save the token
        this.TwitchHeaders.Authorization = "Bearer " + body.access_token;
        console.log(
          "TWM: Twitch API token retreived succesfully: " +
            this.TwitchHeaders.Authorization
        );
      }
    });

    // 2) Clear 'channels' collection - will re-populate below and update live status
    Channels.deleteMany({}, (err, result) => {
      if (err)
        console.log("TWM: error clearing channels: " + JSON.stringify(err));
    });

    // 3) if dev, setup ngrok
    if (process.env.NODE_ENV !== "production") {
      this.setupNgrok();
    }
  }

  async setupNgrok() {
    const ngrok = require("ngrok");
    const url = await ngrok.connect(3005);
    this.NGROK_URL = url;
    console.log("TWM: ngrok setup with url: " + url);
  }

  search(query) {
    return axios
      .get(this.HELIX_ENDPOINTS.SearchChannels, {
        params: {
          query,
        },
        headers: this.TwitchHeaders,
      })
      .then((res) => res.data.data);
  }

  // Subscribes to Twitch webhook updates for all subscribed-to channels
  // runs on interval = TWITCH_API_LEASE_SECONDS
  async SubscribeToChannelUpdates() {
    // Get all unique channels from userdatas collection = newChannels
    var newChannels;
    try {
      newChannels = await UserData.distinct("channels").exec();
      console.log("newChannels: " + newChannels);
    } catch (err) {
      return console.log(
        "TWM: error getting UserData channels: " + JSON.stringify(err)
      );
    }

    // Get all channels from channels collection = oldChannels
    var oldChannels;
    try {
      oldChannels = await Channels.distinct("name").exec();
      console.log("oldChannels: " + oldChannels);
    } catch (err) {
      return console.log(
        "TWM: error getting oldChannels: " + JSON.stringify(err)
      );
    }

    // Compare newChannels and oldChannels to get:
    // a) removedChannels = in oldChannels, not in newChannels
    // b) addedChannels = not in oldchannels, in newChannels
    var removedChannels = [];
    oldChannels.forEach((channel) => {
      if (!newChannels.includes(channel)) removedChannels.push(channel);
    });
    console.log("removedChannels: " + removedChannels);

    var addedChannels = [];
    newChannels.forEach((channel) => {
      if (!oldChannels.includes(channel)) addedChannels.push(channel);
    });
    console.log("addedChannels: " + addedChannels);

    // Delete all documents from channels collection where channel in removedChannels
    if (removedChannels.length > 0) {
      Channels.deleteMany({ name: { $in: removedChannels } }, (err, res) => {
        if (err)
          console.log(
            "TWM: error deleting removedChannels: " + JSON.stringify(err)
          );
        console.log("removedChannels mongo result n: " + JSON.stringify(res.n));
      });
    }

    // Insert new documents into channels collection where channel in addedChannels
    if (addedChannels.length > 0) {
      var promises = [Promise];

      var addedChannelObjs = [];
      addedChannels.forEach((channel) => {
        addedChannelObjs.push({ name: channel, live: false });
      });
      Channels.insertMany(addedChannelObjs, (err, docs) => {
        if (err)
          console.log(
            "TWM: error inserting addedChannels: " + JSON.stringify(err)
          );
        // debug: console.log('addedChannels mongo result: ' + JSON.stringify(docs))
      });

      // Pull 'stream' data for addedChannels to enrich Channels collection. Will save:
      // current live status
      {
        let qs = new URLSearchParams();
        addedChannels.forEach((element) => {
          qs.append("user_login", element);
        });
        let options = {
          url: this.HELIX_ENDPOINTS.Streams + "?" + qs,
          json: true,
          headers: this.TwitchHeaders,
        };
        let req_p = util.promisify(request);
        let res;
        try {
          res = await req_p(options);
        } catch (err) {
          console.log("TWM: error pulling addedChannels status: " + err);
        }
        // channels in 'data' array with type=live are live, all others are not
        let liveChannels = [];
        res.body.data.forEach((element) => {
          if (element.type === "live") {
            liveChannels.push(element.user_name.toLowerCase());
          }
        });
        addedChannels.forEach((channel) => {
          if (liveChannels.includes(channel)) {
            promises.push(
              Channels.findOneAndUpdate(
                { name: channel },
                { live: true },
                { useFindAndModify: false }
              ).exec()
            );
          }
        });
      }
      // Pull 'user' data for addedChannels to enrich Channels collection. Will save:
      // user_id, profile_image_url
      {
        let qs = new URLSearchParams();
        addedChannels.forEach((element) => {
          qs.append("login", element);
        });
        let options = {
          url: this.HELIX_ENDPOINTS.Users + "?" + qs,
          json: true,
          headers: this.TwitchHeaders,
        };
        let req_p = util.promisify(request);
        let res;
        try {
          res = await req_p(options);
        } catch (err) {
          console.log("TWM: error pulling addedChannels 'user' data: " + err);
        }
        // debug: console.log('user data: ' + JSON.stringify(res.body))
        res.body.data.forEach((element) => {
          let user_name = element.login;
          let user_id = element.id;
          let profile_image_url = element.profile_image_url;

          promises.push(
            Channels.findOneAndUpdate(
              { name: user_name },
              { user_id, profile_image_url },
              { useFindAndModify: false }
            ).exec()
          );
        });
      }
    }

    // if we added new channels, wait for the enrichment promises to resolve before Subscribing to Webhooks
    if (promises) {
      Promise.all(promises).then((vals) => {
        this.subToWebhooks();
      });
    } else {
      this.subToWebhooks();
    }
  }

  // Subscribe to Webhook for status updates on all channels
  subToWebhooks() {
    let callbackUrl = this.NGROK_URL || process.env.CALLBACK_URL;
    console.log("callbackUrl: " + callbackUrl);
    if (!callbackUrl)
      return console.error(
        "TWM: cancelling webhook subscriptions - no valid callback URL"
      );
    Channels.find((err, docs) => {
      docs.forEach(async (doc) => {
        console.log("doc: " + JSON.stringify(doc));
        let body = {
          "hub.callback": callbackUrl + "/streams/" + doc.name,
          "hub.mode": "subscribe",
          "hub.topic": this.HELIX_ENDPOINTS.Streams + "?user_id=" + doc.user_id,
          "hub.lease_seconds": this.TWITCH_API_LEASE_SECONDS,
        };

        let options = {
          url: this.HELIX_ENDPOINTS.Subscribe,
          json: true,
          method: "POST",
          body: body,
          headers: this.TwitchHeaders,
        };

        let req_p = util.promisify(request);
        let res;
        try {
          res = await req_p(options);
        } catch (err) {
          return console.log("TWM: error subscribing to webhook: " + err);
        }
        if (res.statusCode === 202) {
          console.log(
            "TWM: successfully subscribed to webhook for " + doc.name
          );
        } else {
          console.log("TWM: webhook subscription returned non-success: ", res);
        }
      });
    });
  }
}

module.exports = TwitchWebhookManager;
