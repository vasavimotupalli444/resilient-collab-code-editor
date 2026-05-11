const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomId:    { type: String, required: true, unique: true, index: true },
    content:   { type: String, default: '' },
    version:   { type: Number, default: 0 },
    language:  { type: String, default: 'javascript' },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
