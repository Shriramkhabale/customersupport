const mongoose = require('mongoose');

const TicketOptionsSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true
  },
  services: [{ type: String, trim: true }],
  materials: [{ type: String, trim: true }],
  locations: [{ type: String, trim: true }],
  customerNames: [{ type: String, trim: true }],
  cities: [{ type: String, trim: true }],
  subjects: [{ type: String, trim: true }],
  descriptions: [{ type: String, trim: true }]
}, { timestamps: true });

module.exports = mongoose.model('TicketOptions', TicketOptionsSchema);