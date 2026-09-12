import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { Import, ImportSchema } from './schemas/import.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Import.name, schema: ImportSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}
