// connection.js
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = async function(callback) {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    await callback(client);
  } catch (e) {
    console.error('❌ MongoDB connection error:', e);
  } finally {
    //await client.close();
  }
};
