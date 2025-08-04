const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

module.exports = async function(callback) {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    await callback(client);
  } catch (err) {
    console.error('❌ DB Connection Error:', err);
  }
};
