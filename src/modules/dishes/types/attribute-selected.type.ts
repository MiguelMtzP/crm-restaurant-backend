import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AttributeType } from '../enums/attribute-type.enum';

export class AttributeSelected {
  @IsString()
  name: string;

  @IsEnum(AttributeType)
  type: AttributeType;

  @IsOptional()
  value?: string | number | boolean;
}
