import { IsString, IsNotEmpty } from 'class-validator';

export class RemoveCustomChargeDto {
  @IsString()
  @IsNotEmpty()
  chargeId: string;
}
