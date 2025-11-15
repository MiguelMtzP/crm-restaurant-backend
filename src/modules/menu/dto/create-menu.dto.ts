import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MenuSource } from '../enums/menu-source.enum';
import { MenuAttribute } from '../types/menu-attribute.type';

export class CreateMenuDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsBoolean()
  @IsOptional()
  isAutoDelivered?: boolean;

  @IsEnum(MenuSource)
  source: MenuSource;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  complements?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuAttribute)
  attributes: MenuAttribute[];

  @IsNumber()
  @Min(0)
  cost: number;
}
