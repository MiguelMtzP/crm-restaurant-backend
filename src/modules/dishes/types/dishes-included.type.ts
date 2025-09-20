import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttributeSelected } from './attribute-selected.type';
import { Type } from 'class-transformer';

export class DishesIncluded {
  @IsString()
  dishMenuId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeSelected)
  attributesSelected: AttributeSelected[];

  @IsOptional()
  @IsString()
  notes?: string;
}
