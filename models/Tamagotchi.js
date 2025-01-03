// models/Tamagotchi.js
const mongoose = require('mongoose');

const TamagotchiSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hunger: { type: Number, default: 50 },
  fun: { type: Number, default: 50 },
  avatar: { type: String, default: 'default-avatar.png' }, // Can be changed later
});

module.exports = mongoose.model('Tamagotchi', TamagotchiSchema);

