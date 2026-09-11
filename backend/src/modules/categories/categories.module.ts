import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  providers: [CategoriesService],
  controllers: [CategoriesController],
  exports: [CategoriesService, MongooseModule],
})
export class CategoriesModule {}
