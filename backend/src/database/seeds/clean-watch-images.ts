import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/kho_online';

async function cleanWatchImages() {
  console.log('Connecting to MongoDB...', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  const productsCol = db.collection('products');

  // Lấy toàn bộ sản phẩm
  const products = await productsCol.find({}).toArray();
  console.log(`Found ${products.length} products to check.`);

  let updatedCount = 0;

  for (const product of products) {
    if (Array.isArray(product.images) && product.images.length > 0) {
      const filteredImages = product.images.filter((img: string) => {
        if (!img || typeof img !== 'string') return false;
        // Lọc bỏ link ảnh đồng hồ Unsplash hoặc link unsplash dummy
        if (img.includes('1523275335684') || img.includes('photo-1523275335684-37898b6baf30')) {
          return false;
        }
        return true;
      });

      if (filteredImages.length !== product.images.length) {
        await productsCol.updateOne(
          { _id: product._id },
          { $set: { images: filteredImages } }
        );
        updatedCount++;
        console.log(
          `Cleaned product "${product.name}" (${product.code}): removed dummy watch images.`
        );
      }
    }
  }

  console.log(`Finished! Cleaned ${updatedCount} products in MongoDB.`);
  await mongoose.disconnect();
}

cleanWatchImages().catch((err) => {
  console.error('Error cleaning images:', err);
  process.exit(1);
});
