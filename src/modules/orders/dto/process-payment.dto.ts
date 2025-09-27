import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PaymentType } from '../enums/payment-type.enum';

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
}
