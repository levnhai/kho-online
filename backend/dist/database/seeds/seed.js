"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt = require("bcryptjs");
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kho_online';
async function seed() {
    console.log('Connecting to MongoDB...', MONGODB_URI);
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');
    const db = mongoose_1.default.connection.db;
    await db.collection('users').deleteMany({});
    await db.collection('categories').deleteMany({});
    await db.collection('products').deleteMany({});
    await db.collection('orders').deleteMany({});
    console.log('Cleared existing collections.');
    const passwordHash = await bcrypt.hash('123456', 10);
    const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
    const users = await db.collection('users').insertMany([
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
        {
            name: 'Trần Thị Mai',
            email: 'tranmai@gmail.com',
            phone: '0912345678',
            password: passwordHash,
            role: 'customer',
            address: 'Số 12 Cầu Giấy, Hà Nội',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ]);
    const adminId = users.insertedIds[0];
    const customerId = users.insertedIds[1];
    const customer2Id = users.insertedIds[2];
    console.log('Seeded 3 users (1 admin, 2 customers).');
    const categories = await db.collection('categories').insertMany([
        {
            name: 'Điện thoại',
            slug: 'dien-thoai',
            description: 'Smartphone chính hãng Apple, Samsung, Xiaomi,...',
            icon: 'Smartphone',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Laptop',
            slug: 'laptop',
            description: 'Laptop văn phòng, Gaming, đồ họa mỏng nhẹ',
            icon: 'Laptop',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Máy tính bảng',
            slug: 'may-tinh-bang',
            description: 'iPad, Samsung Galaxy Tab, máy tính bảng phục vụ học tập & giải trí',
            icon: 'Tablet',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Phụ kiện',
            slug: 'phu-kien',
            description: 'Tai nghe, chuột máy tính, sạc nhanh, bàn phím cơ',
            icon: 'Headphones',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Đồ gia dụng',
            slug: 'do-gia-dung',
            description: 'Robot hút bụi, nồi chiên không dầu, quạt thông minh',
            icon: 'Home',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Thời trang',
            slug: 'thoi-trang',
            description: 'Đồng hồ thông minh, balo công nghệ, phụ kiện thời trang',
            icon: 'Watch',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ]);
    const catDienThoai = categories.insertedIds[0];
    const catLaptop = categories.insertedIds[1];
    const catTablet = categories.insertedIds[2];
    const catPhuKien = categories.insertedIds[3];
    const catGiaDung = categories.insertedIds[4];
    const catThoiTrang = categories.insertedIds[5];
    console.log('Seeded 6 categories.');
    const products = await db.collection('products').insertMany([
        {
            name: 'iPhone 16 Pro Max 256GB Titan Tự Nhiên',
            code: 'IP16PM-256',
            category: catDienThoai,
            price: 34990000,
            salePrice: 32490000,
            stock: 35,
            images: [
                'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
                'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
            ],
            description: 'iPhone 16 Pro Max sở hữu vi xử lý A18 Pro siêu mạnh mẽ, màn hình Super Retina XDR 6.9 inch cùng nút Camera Control hoàn toàn mới.',
            specifications: { 'Màn hình': '6.9 inch Super Retina XDR', 'Chip': 'Apple A18 Pro', 'RAM': '8GB', 'Bộ nhớ trong': '256GB' },
            soldCount: 125,
            rating: 5,
            isFeatured: true,
            status: 'active',
            createdAt: new Date(Date.now() - 15 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'iPhone 16 128GB Xanh Lưu Ly',
            code: 'IP16-128',
            category: catDienThoai,
            price: 22990000,
            salePrice: 21490000,
            stock: 50,
            images: [
                'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
            ],
            description: 'Thiết kế màu sắc pastel nổi bật, camera kép 48MP bắt nét vượt trội, thời lượng pin cả ngày dài.',
            specifications: { 'Màn hình': '6.1 inch OLED', 'Chip': 'Apple A18', 'RAM': '8GB', 'Bộ nhớ': '128GB' },
            soldCount: 94,
            rating: 5,
            isFeatured: true,
            status: 'active',
            createdAt: new Date(Date.now() - 10 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'Samsung Galaxy S24 Ultra 5G 12GB/256GB',
            code: 'SS-S24U-256',
            category: catDienThoai,
            price: 31990000,
            salePrice: 27990000,
            stock: 28,
            images: [
                'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
            ],
            description: 'Tích hợp quyền năng Galaxy AI, khung viền Titan cao cấp, bút S-Pen tiện lợi và camera zoom quang học 100x.',
            specifications: { 'Màn hình': '6.8 inch Dynamic AMOLED 2X 120Hz', 'Chip': 'Snapdragon 8 Gen 3 for Galaxy', 'Pin': '5000 mAh' },
            soldCount: 88,
            rating: 5,
            isFeatured: true,
            status: 'active',
            createdAt: new Date(Date.now() - 25 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'MacBook Pro 14 M3 Pro 18GB/512GB Space Black',
            code: 'MBP-14-M3P',
            category: catLaptop,
            price: 49990000,
            salePrice: 46990000,
            stock: 15,
            images: [
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
            ],
            description: 'Hiệu năng đồ hoạ đỉnh cao dành cho giới chuyên nghiệp sáng tạo, kiến trúc Apple Silicon M3 Pro tiết kiệm điện.',
            specifications: { 'CPU': 'Apple M3 Pro 11 Core', 'GPU': '14 Core GPU', 'RAM': '18GB Unified', 'SSD': '512GB' },
            soldCount: 42,
            rating: 5,
            isFeatured: true,
            status: 'active',
            createdAt: new Date(Date.now() - 30 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'Laptop ASUS ROG Zephyrus G16 RTX 4070',
            code: 'ASUS-ROG-G16',
            category: catLaptop,
            price: 52990000,
            salePrice: 48990000,
            stock: 12,
            images: [
                'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
            ],
            description: 'Laptop Gaming mỏng nhẹ siêu cấp với màn hình OLED 2.5K 240Hz, card đồ hoạ NVIDIA RTX 4070 8GB.',
            specifications: { 'CPU': 'Intel Core Ultra 9 185H', 'VGA': 'RTX 4070 8GB', 'RAM': '32GB LPDDR5X', 'SSD': '1TB' },
            soldCount: 75,
            rating: 5,
            isFeatured: false,
            status: 'active',
            createdAt: new Date(Date.now() - 5 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'Tai nghe Apple AirPods Pro Gen 2 Type-C',
            code: 'AIRPODS-PRO-2',
            category: catPhuKien,
            price: 6190000,
            salePrice: 5390000,
            stock: 60,
            images: [
                'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
            ],
            description: 'Chống ồn chủ động chủ động nâng cấp gấp 2 lần, cổng sạc USB-C tiện dụng, âm thanh không gian cá nhân hoá.',
            specifications: { 'Thời lượng pin': '6 giờ (30 giờ kèm hộp)', 'Cổng sạc': 'USB-C / MagSafe', 'Chống nước': 'IP54' },
            soldCount: 98,
            rating: 5,
            isFeatured: true,
            status: 'active',
            createdAt: new Date(Date.now() - 12 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'Chuột không dây Logitech MX Master 3S',
            code: 'LOGI-MX3S',
            category: catPhuKien,
            price: 2490000,
            salePrice: 2090000,
            stock: 45,
            images: [
                'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
            ],
            description: 'Cảm biến điện tử 8K DPI di chuột trên mọi bề mặt kể cả kính, cuộn MagSpeed siêu tốc cực êm.',
            specifications: { 'DPI': '200 - 8000 DPI', 'Kết nối': 'Bluetooth / Logi Bolt', 'Pin': 'Lên đến 70 ngày' },
            soldCount: 63,
            rating: 5,
            isFeatured: false,
            status: 'active',
            createdAt: new Date(Date.now() - 18 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'Bàn phím cơ không dây AKKO 3098B Plus Multi-modes',
            code: 'AKKO-3098B',
            category: catPhuKien,
            price: 1890000,
            salePrice: 1590000,
            stock: 30,
            images: [
                'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
            ],
            description: 'Switch Akko v3 CS mượt mà, layout 98 phím gọn gàng, LED RGB đa hiệu ứng sắc nét.',
            specifications: { 'Layout': '98 phím', 'Kết nối': 'Type-C / Bluetooth 5.0 / 2.4GHz', 'Keycap': 'PBT Double-shot' },
            soldCount: 55,
            rating: 5,
            isFeatured: false,
            status: 'active',
            createdAt: new Date(Date.now() - 8 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'iPad Pro 11 inch M4 Wi-Fi 256GB Silver',
            code: 'IPAD-M4-11',
            category: catTablet,
            price: 28990000,
            salePrice: 26990000,
            stock: 20,
            images: [
                'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1000&q=80',
                'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=1000&q=80',
                'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=1000&q=80',
                'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&q=80',
            ],
            description: 'Độ mỏng ấn tượng chỉ 5.3mm, màn hình Ultra Retina XDR công nghệ OLED 2 lớp tân tiến nhất.',
            specifications: { 'Màn hình': '11 inch Tandem OLED 120Hz', 'Chip': 'Apple M4 9 Core', 'Bộ nhớ': '256GB' },
            soldCount: 38,
            rating: 5,
            isFeatured: true,
            status: 'active',
            createdAt: new Date(Date.now() - 6 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'Robot Hút Bụi Lau Nhà Dreame L20 Ultra',
            code: 'ROBOT-DREAME-L20',
            category: catGiaDung,
            price: 21990000,
            salePrice: 18490000,
            stock: 18,
            images: [
                'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
            ],
            description: 'Công nghệ cánh tay robot vươn rộng lau sát mép cạnh góc tường, lực hút cực đại 7000Pa tự giặt sấy giẻ bằng nước nóng.',
            specifications: { 'Lực hút': '7000Pa', 'Dung lượng pin': '6400mAh', 'Trạm sạc': 'Tự gom bụi, giặt sấy giẻ' },
            soldCount: 31,
            rating: 5,
            isFeatured: false,
            status: 'active',
            createdAt: new Date(Date.now() - 20 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'Đồng hồ thông minh Apple Watch Series 9 GPS 45mm',
            code: 'AW-S9-45',
            category: catThoiTrang,
            price: 11290000,
            salePrice: 9890000,
            stock: 25,
            images: [
                'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
            ],
            description: 'Tính năng chạm 2 lần Double Tap độc đáo, đo điện tâm đồ ECG, theo dõi nồng độ oxy trong máu SpO2.',
            specifications: { 'Mặt kính': 'Ion-X strengthened glass', 'Chống nước': '50m', 'Thời lượng pin': '18 giờ' },
            soldCount: 46,
            rating: 5,
            isFeatured: true,
            status: 'active',
            createdAt: new Date(Date.now() - 14 * 86400000),
            updatedAt: new Date(),
        },
        {
            name: 'Nồi chiên không dầu điện tử Philips HD9860/90 7.3L',
            code: 'PHILIPS-HD9860',
            category: catGiaDung,
            price: 8490000,
            salePrice: 6990000,
            stock: 22,
            images: [
                'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80',
            ],
            description: 'Công nghệ cảm biến thông minh Smart Sensing tự điều chỉnh nhiệt độ và thời gian nấu chín tối ưu giòn ngoài mềm trong.',
            specifications: { 'Dung tích': '7.3 Lít (chứa nguyên con gà)', 'Công suất': '2225W' },
            soldCount: 29,
            rating: 5,
            isFeatured: false,
            status: 'active',
            createdAt: new Date(Date.now() - 16 * 86400000),
            updatedAt: new Date(),
        }
    ]);
    const p1 = products.insertedIds[0];
    const p6 = products.insertedIds[5];
    const p7 = products.insertedIds[6];
    console.log('Seeded 12 products.');
    await db.collection('orders').insertMany([
        {
            orderCode: '#DH00125',
            customer: customerId,
            customerInfo: {
                name: 'Nguyễn Văn A',
                phone: '0987654321',
                address: 'Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
                note: 'Giao giờ hành chính giúp em',
            },
            items: [
                {
                    product: p1,
                    name: 'iPhone 16 Pro Max 256GB Titan Tự Nhiên',
                    price: 32490000,
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
                    total: 32490000,
                },
                {
                    product: p6,
                    name: 'Tai nghe Apple AirPods Pro Gen 2 Type-C',
                    price: 5390000,
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
                    total: 5390000,
                },
            ],
            subtotal: 37880000,
            shippingFee: 0,
            totalAmount: 37880000,
            paymentMethod: 'COD',
            status: 'PENDING',
            orderDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            orderCode: '#DH00124',
            customer: customerId,
            customerInfo: {
                name: 'Nguyễn Văn A',
                phone: '0987654321',
                address: 'Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
                note: '',
            },
            items: [
                {
                    product: p7,
                    name: 'Chuột không dây Logitech MX Master 3S',
                    price: 2090000,
                    quantity: 2,
                    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
                    total: 4180000,
                },
            ],
            subtotal: 4180000,
            shippingFee: 30000,
            totalAmount: 4210000,
            paymentMethod: 'BANK_TRANSFER',
            status: 'CONFIRMED',
            orderDate: new Date(Date.now() - 86400000),
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date(Date.now() - 86400000),
        },
        {
            orderCode: '#DH00123',
            customer: customer2Id,
            customerInfo: {
                name: 'Trần Thị Mai',
                phone: '0912345678',
                address: 'Số 12 Cầu Giấy, Hà Nội',
                note: 'Gọi trước khi giao',
            },
            items: [
                {
                    product: p6,
                    name: 'Tai nghe Apple AirPods Pro Gen 2 Type-C',
                    price: 5390000,
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
                    total: 5390000,
                },
            ],
            subtotal: 5390000,
            shippingFee: 0,
            totalAmount: 5390000,
            paymentMethod: 'ONLINE',
            status: 'SHIPPING',
            orderDate: new Date(Date.now() - 2 * 86400000),
            createdAt: new Date(Date.now() - 2 * 86400000),
            updatedAt: new Date(Date.now() - 2 * 86400000),
        },
        {
            orderCode: '#DH00122',
            customer: customer2Id,
            customerInfo: {
                name: 'Trần Thị Mai',
                phone: '0912345678',
                address: 'Số 12 Cầu Giấy, Hà Nội',
                note: '',
            },
            items: [
                {
                    product: p1,
                    name: 'iPhone 16 Pro Max 256GB Titan Tự Nhiên',
                    price: 32490000,
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
                    total: 32490000,
                },
            ],
            subtotal: 32490000,
            shippingFee: 0,
            totalAmount: 32490000,
            paymentMethod: 'COD',
            status: 'DELIVERED',
            orderDate: new Date(Date.now() - 4 * 86400000),
            createdAt: new Date(Date.now() - 4 * 86400000),
            updatedAt: new Date(Date.now() - 4 * 86400000),
        },
    ]);
    console.log('Seeded 4 sample orders.');
    await mongoose_1.default.disconnect();
    console.log('Seed completed successfully! ✨');
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map