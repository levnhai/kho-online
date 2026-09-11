"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kho_online';
async function updateImages() {
    console.log('Connecting to MongoDB...', MONGODB_URI);
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');
    const db = mongoose_1.default.connection.db;
    const productsCol = db.collection('products');
    await productsCol.updateOne({ code: 'IPAD-M4-11' }, {
        $set: {
            images: [
                'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1000&q=80',
                'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=1000&q=80',
                'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=1000&q=80',
                'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&q=80',
            ],
        },
    });
    await productsCol.updateOne({ code: 'IP16PM-256' }, {
        $set: {
            images: [
                'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1000&q=80',
                'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1000&q=80',
                'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1000&q=80',
                'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=1000&q=80',
            ],
        },
    });
    await productsCol.updateOne({ code: 'SS-S24U-256' }, {
        $set: {
            images: [
                'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1000&q=80',
                'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1000&q=80',
                'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1000&q=80',
            ],
        },
    });
    await productsCol.updateOne({ code: 'MBP-14-M3P' }, {
        $set: {
            images: [
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&q=80',
                'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=1000&q=80',
                'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=1000&q=80',
            ],
        },
    });
    await productsCol.updateOne({ code: 'AIRPODS-PRO-2' }, {
        $set: {
            images: [
                'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1000&q=80',
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80',
                'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=1000&q=80',
            ],
        },
    });
    console.log('Successfully updated product images in MongoDB!');
    await mongoose_1.default.disconnect();
}
updateImages().catch((err) => {
    console.error('Error updating images:', err);
    process.exit(1);
});
//# sourceMappingURL=update-images.js.map