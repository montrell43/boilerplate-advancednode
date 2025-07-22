require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully');
    const dbs = await client.db().admin().listDatabases();
    console.log('Your databases:', dbs.databases.map(db => db.name));
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.close();
  }
}

testConnection();
