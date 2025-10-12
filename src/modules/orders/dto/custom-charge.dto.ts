import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';

export class CustomChargeDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}
