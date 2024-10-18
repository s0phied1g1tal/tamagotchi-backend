const mongoose = require('mongoose');

const TamagotchiSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    hunger: { type: Number, required: true, default: 100 },
    fun: { type: Number, required: true, default: 100 },
});

module.exports = mongoose.model('Tamagotchi', TamagotchiSchema);

