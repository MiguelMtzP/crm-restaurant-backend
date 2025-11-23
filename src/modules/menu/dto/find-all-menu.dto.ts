import { IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllMenuDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  excludeHidden?: boolean;
}
