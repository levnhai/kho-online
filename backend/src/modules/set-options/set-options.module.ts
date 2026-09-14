import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SetOption, SetOptionSchema } from './schemas/set-option.schema';
import { SetOptionsController } from './set-options.controller';
import { SetOptionsService } from './set-options.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SetOption.name, schema: SetOptionSchema }]),
  ],
  controllers: [SetOptionsController],
  providers: [SetOptionsService],
  exports: [SetOptionsService],
})
export class SetOptionsModule {}
