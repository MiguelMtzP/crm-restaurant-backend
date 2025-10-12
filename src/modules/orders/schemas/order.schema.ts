import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentType } from '../enums/payment-type.enum';

export type OrderDocument = Order & Document;

@Schema({ _id: true })
export class CustomCharge {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: false, type: String })
  description?: string;
}

export const CustomChargeSchema = SchemaFactory.createForClass(CustomCharge);

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Order {
  @Prop({ required: true, type: Number })
  table: number;

  @Prop({ required: true, type: Number })
  people: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  waiterId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.OPEN })
  status: OrderStatus;

  @Prop({ required: false })
  cancelReason: string;

  @Prop({ type: Number, default: 0 })
  account: number;

  @Prop({ type: Number, default: 0 })
  tip: number;

  @Prop({ enum: PaymentType })
  paymentType: PaymentType;

  @Prop({ type: Number })
  cardTxNumber: number;

  @Prop({ type: Number })
  cashReceived: number;

  @Prop({ type: Number })
  cashReturned: number;

  @Prop({ type: [CustomChargeSchema], default: [] })
  customCharges: CustomCharge[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
