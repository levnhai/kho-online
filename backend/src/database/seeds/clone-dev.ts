import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const BASE_URI = process.env.MONGODB_URI;
if (!BASE_URI) {
  console.error('❌ Không tìm thấy biến môi trường MONGODB_URI trong file .env');
  process.exit(1);
}

async function cloneDatabase() {
  const sourceDbName = 'kho_online';
  const targetDbName = 'kho_online_dev';

  console.log(`🚀 Bắt đầu clone dữ liệu từ [${sourceDbName}] sang [${targetDbName}]...\n`);

  const client = new MongoClient(BASE_URI);

  try {
    await client.connect();
    console.log('✅ Đã kết nối tới MongoDB Cluster thành công!');

    const sourceDb = client.db(sourceDbName);
    const targetDb = client.db(targetDbName);

    // Lấy danh sách tất cả các collection trong database nguồn
    const collections = await sourceDb.listCollections().toArray();
    console.log(`📦 Tìm thấy ${collections.length} collections:`, collections.map((c) => c.name).join(', '));

    for (const col of collections) {
      const colName = col.name;
      // Bỏ qua các system collection nếu có
      if (colName.startsWith('system.')) continue;

      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      // Đọc toàn bộ documents từ nguồn
      const docs = await sourceCol.find({}).toArray();

      // Xoá collection cũ ở target
      await targetCol.deleteMany({});

      // Copy sang target nếu có documents
      if (docs.length > 0) {
        await targetCol.insertMany(docs);
        console.log(`  ✔ [${colName}]: Đã sao chép ${docs.length} documents.`);
      } else {
        console.log(`  ✔ [${colName}]: Collection rỗng (0 documents).`);
      }

      // Sao chép index (nếu có)
      try {
        const indexes = await sourceCol.indexes();
        for (const idx of indexes) {
          if (idx.name === '_id_') continue;
          const { key, ...options } = idx;
          await targetCol.createIndex(key, options as any).catch(() => {});
        }
      } catch (err) {
        // bỏ qua nếu lỗi index
      }
    }

    console.log(`\n🎉 HOÀN TẤT! Đã đồng bộ toàn bộ dữ liệu sang database [${targetDbName}] thành công!`);
  } catch (err: any) {
    console.error('❌ Lỗi khi clone database:', err.message || err);
  } finally {
    await client.close();
  }
}

cloneDatabase();
