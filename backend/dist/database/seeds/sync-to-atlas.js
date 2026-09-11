"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kho_online';
if (!MONGODB_URI.includes('?') && !MONGODB_URI.split('/').pop()?.length) {
    MONGODB_URI = MONGODB_URI.replace(/\/?$/, '/kho_online');
}
else if (MONGODB_URI.includes('.mongodb.net') && !MONGODB_URI.includes('.mongodb.net/')) {
    MONGODB_URI = MONGODB_URI.replace('.mongodb.net', '.mongodb.net/kho_online?retryWrites=true&w=majority');
}
console.log('Target MongoDB URI:', MONGODB_URI);
const initialCategories = [
    {
        name: 'Điện thoại',
        slug: 'dien-thoai',
        description: 'Smartphone chính hãng Apple, Samsung, Xiaomi,...',
        icon: 'Smartphone',
        subcategories: ['iPhone', 'Samsung Galaxy', 'Xiaomi', 'Oppo'],
    },
    {
        name: 'Laptop',
        slug: 'laptop',
        description: 'Laptop văn phòng, Gaming, đồ họa mỏng nhẹ',
        icon: 'Laptop',
        subcategories: ['MacBook', 'Laptop Gaming Asus ROG', 'Dell XPS', 'Lenovo ThinkPad'],
    },
    {
        name: 'Máy tính bảng',
        slug: 'may-tinh-bang',
        description: 'iPad, Samsung Galaxy Tab, máy tính bảng phục vụ học tập & giải trí',
        icon: 'Tablet',
        subcategories: ['iPad Pro / Air', 'Samsung Galaxy Tab', 'Xiaomi Pad'],
    },
    {
        name: 'Phụ kiện',
        slug: 'phu-kien',
        description: 'Tai nghe, chuột máy tính, sạc nhanh, bàn phím cơ',
        icon: 'Headphones',
        subcategories: ['Tai nghe Bluetooth / AirPods', 'Bàn phím cơ', 'Chuột không dây MX Master', 'Củ cáp sạc nhanh'],
    },
    {
        name: 'Đồ gia dụng',
        slug: 'do-gia-dung',
        description: 'Robot hút bụi, nồi chiên không dầu, quạt thông minh',
        icon: 'Home',
        subcategories: ['Robot hút bụi Dreame', 'Nồi chiên không dầu Philips', 'Máy lọc không khí'],
    },
    {
        name: 'Thời trang',
        slug: 'thoi-trang',
        description: 'Đồng hồ thông minh, balo công nghệ, phụ kiện thời trang',
        icon: 'Watch',
        subcategories: ['Đồng hồ thông minh Apple Watch', 'Vòng đeo sức khỏe'],
    },
];
async function sync() {
    try {
        console.log('Connecting to database...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected successfully!');
        const db = mongoose_1.default.connection.db;
        console.log('Syncing categories and subcategories into DB...');
        for (const cat of initialCategories) {
            const existing = await db.collection('categories').findOne({ slug: cat.slug });
            if (existing) {
                await db.collection('categories').updateOne({ _id: existing._id }, { $set: { subcategories: cat.subcategories, name: cat.name, description: cat.description, icon: cat.icon, updatedAt: new Date() } });
                console.log(`Updated category: ${cat.name} with ${cat.subcategories.length} subcategories`);
            }
            else {
                await db.collection('categories').insertOne({
                    ...cat,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`Inserted category: ${cat.name} with ${cat.subcategories.length} subcategories`);
            }
        }
        const userCount = await db.collection('users').countDocuments();
        if (userCount === 0) {
            console.log('Seeding initial admin and test users...');
            const passwordHash = await bcrypt.hash('123456', 10);
            const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
            await db.collection('users').insertMany([
                {
                    name: 'Quản Trị Viên KHO',
                    email: 'admin@kho.vn',
                    phone: '0901234567',
                    password: adminPasswordHash,
                    role: 'admin',
                    address: 'Tòa nhà KHO, 123 Đường Công Nghệ, Hà Nội',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Nguyễn Văn A',
                    email: 'khachhang@gmail.com',
                    phone: '0987654321',
                    password: passwordHash,
                    role: 'customer',
                    address: 'Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
            console.log('Seeded users.');
        }
        const productCount = await db.collection('products').countDocuments();
        if (productCount === 0) {
            console.log('No products found on Atlas. Seeding sample products...');
            const catList = await db.collection('categories').find().toArray();
            const catMap = {};
            catList.forEach(c => { catMap[c.slug] = c._id; });
            const sampleProducts = [
                {
                    name: 'Laptop ASUS ROG Zephyrus G16 RTX 4070',
                    code: 'ASUS-ROG-G16',
                    category: catMap['laptop'],
                    price: 52990000,
                    salePrice: 48990000,
                    stock: 12,
                    soldCount: 75,
                    status: 'active',
                    isFeatured: true,
                    images: [
                        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80',
                        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
                    ],
                    description: 'Laptop gaming cao cấp màn hình OLED 240Hz, CPU Intel Core Ultra 9, RTX 4070 mạnh mẽ.',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'iPhone 16 Pro Max 256GB Titan Tự Nhiên',
                    code: 'IP16PM-256',
                    category: catMap['dien-thoai'],
                    price: 34990000,
                    salePrice: 32490000,
                    stock: 35,
                    soldCount: 125,
                    status: 'active',
                    isFeatured: true,
                    images: [
                        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
                        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
                    ],
                    description: 'Chip A18 Pro mạnh mẽ, camera điều khiển chuyên nghiệp, thời lượng pin cả ngày.',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'iPad Pro 11 inch M4 Wi-Fi 256GB Silver',
                    code: 'IPAD-M4-11',
                    category: catMap['may-tinh-bang'],
                    price: 28990000,
                    salePrice: 26990000,
                    stock: 20,
                    soldCount: 38,
                    status: 'active',
                    isFeatured: true,
                    images: [
                        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
                    ],
                    description: 'Màn hình Ultra Retina XDR OLED kép, mỏng kỷ lục, chip M4 siêu đỉnh.',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Chuột không dây Logitech MX Master 3S',
                    code: 'LOGI-MX3S',
                    category: catMap['phu-kien'],
                    price: 2490000,
                    salePrice: 2090000,
                    stock: 45,
                    soldCount: 63,
                    status: 'active',
                    isFeatured: true,
                    images: [
                        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
                    ],
                    description: 'Chuột công thái học cao cấp cho lập trình viên và nhà thiết kế.',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Nồi chiên không dầu điện tử Philips HD9860/90 7.3L',
                    code: 'PHILIPS-HD9860',
                    category: catMap['do-gia-dung'],
                    price: 8490000,
                    salePrice: 6990000,
                    stock: 22,
                    soldCount: 29,
                    status: 'active',
                    isFeatured: false,
                    images: [
                        'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80',
                    ],
                    description: 'Công nghệ cảm biến thông minh Smart Sensing, dung tích lớn cho cả gia đình.',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Đồng hồ thông minh Apple Watch Series 9 GPS 45mm',
                    code: 'AW-S9-45',
                    category: catMap['thoi-trang'],
                    price: 10490000,
                    salePrice: 9890000,
                    stock: 25,
                    soldCount: 46,
                    status: 'active',
                    isFeatured: true,
                    images: [
                        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
                    ],
                    description: 'Cử chỉ chạm hai lần Double Tap kỳ diệu, màn hình sáng gấp đôi.',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            await db.collection('products').insertMany(sampleProducts);
            console.log('Seeded sample products.');
        }
        console.log('✅ SYNC COMPLETED SUCCESSFULLY!');
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Sync failed:', err);
        process.exit(1);
    }
}
sync();
//# sourceMappingURL=sync-to-atlas.js.map