import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kho_online';
if (!MONGODB_URI.includes('?') && !MONGODB_URI.split('/').pop()?.length) {
  MONGODB_URI = MONGODB_URI.replace(/\/?$/, '/kho_online');
} else if (MONGODB_URI.includes('.mongodb.net') && !MONGODB_URI.includes('.mongodb.net/')) {
  MONGODB_URI = MONGODB_URI.replace('.mongodb.net', '.mongodb.net/kho_online?retryWrites=true&w=majority');
}

console.log('Target MongoDB URI:', MONGODB_URI);

async function checkDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;

    // Đọc số lượng thực tế từ Database
    const [userCount, categoryCount, productCount, orderCount, importCount] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('categories').countDocuments(),
      db.collection('products').countDocuments(),
      db.collection('orders').countDocuments(),
      db.collection('imports').countDocuments(),
    ]);

    console.log('\n📊 THỐNG KÊ DỮ LIỆU THỰC TẾ TRONG DATABASE:');
    console.log(`- Người dùng (Users): ${userCount}`);
    console.log(`- Danh mục (Categories): ${categoryCount}`);
    console.log(`- Sản phẩm (Products): ${productCount}`);
    console.log(`- Đơn hàng (Orders): ${orderCount}`);
    console.log(`- Đơn nhập hàng (Imports): ${importCount}`);

    const categories = await db.collection('categories').find().project({ name: 1, slug: 1, subcategories: 1 }).toArray();
    console.log('\nDanh mục hiện có trong DB:', categories.map(c => `${c.name} (${c.slug})`));

    console.log('\n✅ Toàn bộ dữ liệu được quản lý động trực tiếp từ Database qua API.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Database check failed:', err);
    process.exit(1);
  }
}

checkDatabase();
