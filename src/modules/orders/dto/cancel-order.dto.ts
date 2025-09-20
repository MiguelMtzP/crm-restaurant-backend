import { IsString, MinLength } from 'class-validator';
import { MaxLength } from 'class-validator';
import { IsOptional } from 'class-validator';

export class CancelOrderDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsOptional()
  cancelReason: string;
}
