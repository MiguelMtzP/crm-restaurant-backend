import { IsNumber, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsNumber()
  @Min(0)
  packagePrice: number;
}
