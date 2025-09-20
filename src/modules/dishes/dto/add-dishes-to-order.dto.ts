import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDishDto } from './create-dish.dto';

export class AddDishesToOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDishDto)
  dishes: CreateDishDto[];
}
