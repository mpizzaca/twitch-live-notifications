const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  live: { type: Boolean, required: true },
  user_id: { type: Number, required: false },
  profile_image_url: { type: String, required: false },
});

const Channel = mongoose.model('Channel', ChannelSchema);
module.exports = Channel;
