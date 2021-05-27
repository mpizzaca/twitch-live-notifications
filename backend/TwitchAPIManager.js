const request = require("request");
const axios = require("axios").default;
const util = require("util");
const { Users } = require("./models");

const TWITCH_API_LEASE_SECONDS =
  process.env.NODE_ENV === "production" ? 300 : 30;

// will be defined in `development` mode only - how we will receive callbacks from the Twitch API
let NGROK_URL;

const HELIX_ENDPOINTS = {
  GetSubscriptions: "https://api.twitch.tv/helix/webhooks/subscriptions",
  Subscribe: "https://api.twitch.tv/helix/webhooks/hub",
  Users: "https://api.twitch.tv/helix/users",
  Streams: "https://api.twitch.tv/helix/streams",
  SearchChannels: "https://api.twitch.tv/helix/search/channels",
  Token: "https://id.twitch.tv/oauth2/token",
};

const HELIX_HEADERS = {
  "Client-ID": process.env.TWITCH_CLIENT_ID,
};

// Retrieve and set the twitch API token
axios(HELIX_ENDPOINTS.Token, {
  method: "POST",
  params: {
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials",
  },
})
  .then((response) => {
    if (response.status !== 200) {
      return Promise.reject({
        status: response.status,
        message: response.data,
      });
    }

    // Set the token
    HELIX_HEADERS.Authorization = "Bearer " + response.data.access_token;
    console.log(
      "TWM: Twitch API token retreived succesfully: ",
      HELIX_HEADERS.Authorization
    );

    // if dev, setup ngrok
    if (process.env.NODE_ENV !== "production") {
      require("ngrok")
        .connect(3005)
        .then((url) => {
          NGROK_URL = url;
          console.log("TWM: ngrok setup with url: " + url);
        });
    }
  })
  .catch((err) => console.log("TWM: Error retrieving API token.", err));

const search = (query) => {
  return axios
    .get(HELIX_ENDPOINTS.SearchChannels, {
      params: {
        query,
      },
      headers: HELIX_HEADERS,
    })
    .then((res) => res.data.data);
};

// Subscribes to Twitch webhook updates for all subscribed-to channels
// runs on interval = TWITCH_API_LEASE_SECONDS
const subscribeToChannelUpdates = async () => {
  Users.distinct("channels")
    .exec()
    .then((res) =>
      console.log("SubscribeToChannelUpdates Users distinct: ", res)
    );

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
        headers: this.HELIX_HEADERS,
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
        headers: this.HELIX_HEADERS,
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
      subToWebhooks();
    });
  } else {
    subToWebhooks();
  }
};

// Subscribe to Webhook for status updates on all channels
const subToWebhooks = () => {
  let callbackUrl = NGROK_URL || process.env.CALLBACK_URL;
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
        "hub.topic": HELIX_ENDPOINTS.Streams + "?user_id=" + doc.user_id,
        "hub.lease_seconds": TWITCH_API_LEASE_SECONDS,
      };

      let options = {
        url: HELIX_ENDPOINTS.Subscribe,
        json: true,
        method: "POST",
        body: body,
        headers: HELIX_HEADERS,
      };

      let req_p = util.promisify(request);
      let res;
      try {
        res = await req_p(options);
      } catch (err) {
        return console.log("TWM: error subscribing to webhook: " + err);
      }
      if (res.statusCode === 202) {
        console.log("TWM: successfully subscribed to webhook for " + doc.name);
      } else {
        console.log("TWM: webhook subscription returned non-success: ", res);
      }
    });
  });
};

module.exports = { search, subscribeToChannelUpdates };
