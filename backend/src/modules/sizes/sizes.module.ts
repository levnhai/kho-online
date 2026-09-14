import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Size, SizeSchema } from './schemas/size.schema';
import { SizesService } from './sizes.service';
import { SizesController } from './sizes.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Size.name, schema: SizeSchema }]),
  ],
  controllers: [SizesController],
  providers: [SizesService],
  exports: [SizesService],
})
export class SizesModule {}
