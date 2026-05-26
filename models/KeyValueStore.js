const { mongoose } = require('../handlers/database');

const keyValueSchema = new mongoose.Schema(
  {
    namespace: { type: String, required: true, index: true },
    key: { type: String, required: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

keyValueSchema.index({ namespace: 1, key: 1 }, { unique: true });

module.exports = mongoose.models.KeyValueStore || mongoose.model('KeyValueStore', keyValueSchema);
