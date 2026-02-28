require("dotenv").config();
const { Client } = require("pg");
const scrypt = require("../../node_modules/scrypt-kdf");

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL + "?sslmode=require",
  });
  await client.connect();

  try {
    const adminHashBuf = await scrypt.kdf("admin123456", {
      logN: 15,
      r: 8,
      p: 1,
    });
    const adminHash = adminHashBuf.toString("base64");

    await client.query(
      "UPDATE provider_identity SET provider_metadata = jsonb_set(COALESCE(provider_metadata, '{}'), '{password}', $1::jsonb) WHERE entity_id = 'admin@dakkah.sa'",
      [JSON.stringify(adminHash)],
    );
    console.log("Admin password updated in DB!");

    const custHashBuf = await scrypt.kdf("Dakkah2024!", {
      logN: 15,
      r: 8,
      p: 1,
    });
    const custHash = custHashBuf.toString("base64");

    await client.query(
      "UPDATE provider_identity SET provider_metadata = jsonb_set(COALESCE(provider_metadata, '{}'), '{password}', $1::jsonb) WHERE entity_id LIKE '%@dakkah.com'",
      [JSON.stringify(custHash)],
    );
    console.log("Customer passwords updated in DB!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.end();
  }
}
run();
