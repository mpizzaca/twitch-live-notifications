const axios = require("axios").default;
const { Users } = require("./models");

// will be defined in `development` mode only - how we will receive callbacks from the Twitch API on localhost
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

// setup constant variables
const TWITCH_API_LEASE_SECONDS =
  process.env.NODE_ENV === "production" ? 300 : 30;
const AVATAR_URL_UPDATE_FREQUENCY_MS = 3 * 24 * 60 * 60 * 1000; // every 3 days

// if dev, setup ngrok
if (process.env.NODE_ENV !== "production") {
  require("ngrok")
    .connect(3005)
    .then((url) => {
      NGROK_URL = url;
      console.log("TWM: ngrok setup with url: " + url);
    });
}

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
  })
  .then(() => {
    // Refresh the 'live' status of all channels
    updateLiveStatus();
    // Update the avatarURL of all channels
    updateChannelAvatars();
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

// TODO: periodically fetch updated profile images for all channels
// to fetch updated profile image -> 'Users' endpoint

// Subscribes to Twitch webhook updates for all subscribed-to channels
const subscribeToStreamUpdates = () => {
  Users.distinct("channels").then((channels) => {
    for (channel of channels) {
      const callbackURL = process.env.CALLBACK_URL || NGROK_URL;
      const body = {
        "hub.callback": `${callbackURL}/streams/${channel.name}`,
        "hub.mode": "subscribe",
        "hub.topic": `${HELIX_ENDPOINTS.Streams}?user_id=${channel.id}`,
        "hub.lease_seconds": TWITCH_API_LEASE_SECONDS,
        "hub.secret": process.env.TWITCH_WEBHOOK_SECRET,
      };

      axios
        .post(HELIX_ENDPOINTS.Subscribe, body, {
          headers: HELIX_HEADERS,
          json: true,
        })
        .catch((err) => console.log("Error subscribing to webhook: ", err));
    }
  });
};

const updateChannelAvatars = () => {
  Users.distinct("channels").then((channels) => {
    for (channel of channels) {
      // Use a closure to maintain reference to 'channel' in .then()
      (function (channel) {
        axios
          .get(`${HELIX_ENDPOINTS.Users}?login=${channel.name}`, {
            headers: HELIX_HEADERS,
          })
          .then((userData) => {
            const avatarURL = userData.data.data[0]?.profile_image_url;
            if (!avatarURL) {
              return console.log(
                "Error updating channel avatar: ",
                channel.name
              );
            }
            console.log(`Setting ${channel.name}'s avatarURL to ${avatarURL}`);

            return Users.updateMany(
              { channels: { $elemMatch: { name: channel.name } } },
              { $set: { "channels.$[channel].avatarURL": avatarURL } },
              { arrayFilters: [{ "channel.name": { $eq: channel.name } }] }
            );
          });
      })(channel);
    }
  });
};

const updateLiveStatus = () => {
  Users.distinct("channels").then((channels) => {
    for (channel of channels) {
      // Use a closure to maintain reference to 'channel' in .then()
      (function (channel) {
        axios
          .get(`${HELIX_ENDPOINTS.Streams}?user_id=${channel.id}`, {
            headers: HELIX_HEADERS,
          })
          .then((streamData) => {
            // Save current live status
            const live = streamData.data.data[0]?.type === "live";
            console.log(`Setting ${channel.name}'s LIVE status to ${live}`);

            return Users.updateMany(
              { channels: { $elemMatch: { name: channel.name } } },
              { $set: { "channels.$[channel].live": live } },
              { arrayFilters: [{ "channel.name": { $eq: channel.name } }] }
            );
          })
          .catch((err) =>
            console.log("Error saving current LIVE status:", err)
          );
      })(channel);
    }
  });
};

module.exports = {
  search,
  subscribeToStreamUpdates,
  updateChannelAvatars,
  TWITCH_API_LEASE_SECONDS,
  AVATAR_URL_UPDATE_FREQUENCY_MS,
};
