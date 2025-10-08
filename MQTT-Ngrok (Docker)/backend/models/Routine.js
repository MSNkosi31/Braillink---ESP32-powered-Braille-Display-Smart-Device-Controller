const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  action: {
    type: String,
    required: true
  }
}, { _id: false });

const routineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  actions: {
    type: [actionSchema],
    validate: {
      validator: arr => arr.length > 0,
      message: 'A routine must contain at least one action'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Routine', routineSchema);