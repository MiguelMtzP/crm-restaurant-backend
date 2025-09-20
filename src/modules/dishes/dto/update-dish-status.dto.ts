import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DishStatus } from '../enums/dish-status.enum';

export class UpdateDishStatusDto {
  @IsEnum(DishStatus)
  status: DishStatus;

  @IsOptional()
  @IsString()
  conflictReason?: string;
}
