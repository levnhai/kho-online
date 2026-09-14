import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Color, ColorSchema } from './schemas/color.schema';
import { ColorsController } from './colors.controller';
import { ColorsService } from './colors.service';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Color.name, schema: ColorSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [ColorsController],
  providers: [ColorsService],
  exports: [ColorsService],
})
export class ColorsModule {}
