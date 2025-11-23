import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AttributeSelected } from './attribute-selected.type';
import { Type } from 'class-transformer';

export class DishesIncluded {
  @IsString()
  dishMenuId: string;

  @IsBoolean()
  @IsOptional()
  alreadyDelivered?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeSelected)
  attributesSelected: AttributeSelected[];

  @IsOptional()
  @IsString()
  notes?: string;
}
