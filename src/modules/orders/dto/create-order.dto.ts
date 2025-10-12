import {
  IsNumber,
  Min,
  IsMongoId,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Schema as MongooseSchema } from 'mongoose';
import { Type } from 'class-transformer';
import { CustomChargeDto } from './custom-charge.dto';

export class CreateOrderDto {
  @IsNumber()
  @Min(1)
  table: number;

  @IsNumber()
  @Min(1)
  people: number;

  @IsMongoId()
  waiterId: MongooseSchema.Types.ObjectId;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomChargeDto)
  customCharges?: CustomChargeDto[];
}
