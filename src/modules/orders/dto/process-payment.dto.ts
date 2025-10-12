import {
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '../enums/payment-type.enum';
import { CustomChargeDto } from './custom-charge.dto';

export class ProcessPaymentDto {
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsOptional()
  @IsNumber()
  cardTxNumber?: number;

  @IsOptional()
  @IsNumber()
  tip?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cashReceived?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomChargeDto)
  customCharges?: CustomChargeDto[];
}
