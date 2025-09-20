import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { DishType } from '../enums/dish-type.enum';
import { DishesIncluded } from '../types/dishes-included.type';
import { DishStatus } from '../enums/dish-status.enum';

export class CreateDishDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DishesIncluded)
  dishMenuIds: DishesIncluded[];

  @IsMongoId()
  orderId: MongooseSchema.Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  complementOfDishId?: Types.ObjectId;

  @IsEnum(DishType)
  type: DishType;

  @IsBoolean()
  @IsOptional()
  isAutoDelivered?: boolean;

  @IsEnum(DishStatus)
  @IsOptional()
  status?: DishStatus;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  kitchenIndex?: number;

  @IsBoolean()
  @IsOptional()
  isComplementCoffe?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
