const fs = require('fs');
const path = require('path');
const { MongoClient } = require('../smart-order-hub-server/node_modules/mongodb');
const { EJSON } = require('../smart-order-hub-server/node_modules/bson');

const args = process.argv.slice(2);
const onlyIfEmpty = args.includes('--if-empty');
const [uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017', databaseName] =
  args.filter((arg) => arg !== '--if-empty');
const dataDirectory = __dirname;

const uniqueIndexes = {
  user_account: [['user_id', true], ['username', true], ['email', true]],
  role: [['role_id', true], ['role_name', true]],
  customer: [['customer_id', true], ['sap_customer_code', true]],
  customer_account_link: [[['user_id', 1, 'customer_id', 1], true]],
  product: [['product_id', true], ['sku_code', true]],
  unit_of_measure: [['uom_id', true], ['uom_code', true]],
  uom_conversion: [['conversion_id', true]],
  customer_po: [['po_id', true], [['customer_id', 1, 'customer_reference_po', 1], true]],
  po_version: [['version_id', true], [['po_id', 1, 'version_number', 1], true]],
  po_item: [['po_item_id', true], [['version_id', 1, 'line_number', 1], true]],
  standardized_po: [['standardized_po_id', true], [['version_id', 1, 'standardization_attempt', 1], true]],
  standardized_po_item: [['standardized_item_id', true]],
  sap_integration_transaction: [['transaction_id', true], [['request_id', 1], true, { sparse: true }]],
  order_status: [['status_code', true], ['status_name', true]]
};

function indexSpec(value) {
  if (typeof value[0] === 'string') return [{ [value[0]]: 1 }, { unique: value[1] }];
  const fields = value[0];
  const key = {};
  for (let i = 0; i < fields.length; i += 2) key[fields[i]] = fields[i + 1];
  return [key, { unique: value[1], ...(value[2] || {}) }];
}

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(databaseName || process.env.MONGO_DB_NAME || 'smart_order_hub');
    if (onlyIfEmpty && (await db.listCollections({}, { nameOnly: true }).hasNext())) {
      console.log('Database ' + db.databaseName + ' already has collections; skipped demo import.');
      return;
    }
    const files = fs.readdirSync(dataDirectory).filter((file) => file.endsWith('.json')).sort();

    for (const file of files) {
      const collectionName = path.basename(file, '.json');
      const documents = EJSON.parse(fs.readFileSync(path.join(dataDirectory, file), 'utf8'));
      const collection = db.collection(collectionName);
      if (!onlyIfEmpty) await collection.drop().catch(() => {});
      if (documents.length) await collection.insertMany(documents, { ordered: true });
      console.log(`Imported ${file} -> ${db.databaseName}.${collectionName} (${documents.length})`);
    }

    for (const [collectionName, specs] of Object.entries(uniqueIndexes)) {
      const collection = db.collection(collectionName);
      for (const spec of specs) {
        const [key, options] = indexSpec(spec);
        await collection.createIndex(key, options);
      }
    }
    await db.collection('po_status_history').createIndex({ po_id: 1, changed_at: 1 });
    console.log(`Imported dataset and created indexes in ${db.databaseName}.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
