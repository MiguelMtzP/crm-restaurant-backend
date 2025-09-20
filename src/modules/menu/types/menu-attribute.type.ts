import { IsArray, IsOptional, IsString } from 'class-validator';

export class MenuAttribute {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsArray()
  @IsOptional()
  options?: string[];
}
