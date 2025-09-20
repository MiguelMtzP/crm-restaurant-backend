import { IsNumber, Min, IsMongoId } from 'class-validator';
import { Schema as MongooseSchema } from 'mongoose';

export class CreateOrderDto {
  @IsNumber()
  @Min(1)
  table: number;

  @IsNumber()
  @Min(1)
  people: number;

  @IsMongoId()
  waiterId: MongooseSchema.Types.ObjectId;
}
