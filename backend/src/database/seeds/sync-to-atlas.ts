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

    // Cập nhật subcategories chuẩn cho các danh mục nếu chưa có
    const categorySubcategoriesMap: Record<string, string[]> = {
      'dien-thoai': ['iPhone', 'Samsung Galaxy', 'Xiaomi', 'OPPO', 'Vivo'],
      'laptop': ['MacBook', 'Laptop Gaming', 'Laptop Văn Phòng', 'ASUS ROG', 'Dell XPS'],
      'may-tinh-bang': ['iPad Pro / Air', 'Samsung Galaxy Tab', 'Xiaomi Pad'],
      'phu-kien': ['Tai nghe AirPods / Buds', 'Chuột & Bàn phím', 'Củ sạc & Cáp nhanh', 'Loa Bluetooth', 'Bao da & Ốp lưng'],
      'do-gia-dung': ['Robot hút bụi lau nhà', 'Nồi chiên không dầu', 'Quạt thông minh', 'Máy lọc không khí'],
      'thoi-trang': ['Apple Watch & Smartwatch', 'Balo công nghệ', 'Túi chống sốc', 'Dây đeo & Phụ kiện'],
    };

    for (const [slug, subcategories] of Object.entries(categorySubcategoriesMap)) {
      await db.collection('categories').updateOne(
        { slug },
        { $set: { subcategories, updatedAt: new Date() } }
      );
    }
    console.log('✅ Đã cập nhật thể loại con (subcategories) thành công cho các danh mục.');

    const categories = await db.collection('categories').find().project({ name: 1, slug: 1, subcategories: 1 }).toArray();
    console.log('\nDanh mục sau cập nhật:');
    categories.forEach(c => {
      console.log(`- ${c.name} (${c.slug}): [${(c.subcategories || []).join(', ')}]`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Database check failed:', err);
    process.exit(1);
  }
}

checkDatabase();

