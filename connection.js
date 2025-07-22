const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log('Mongo URI:', process.env.MONGO_URI);

module.exports = async function (callback) {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    callback(client);
  } catch (err) {
    console.error('❌ DB Connection Error:', err);
    callback(null);
  }
};
