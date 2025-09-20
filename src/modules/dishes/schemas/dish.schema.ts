import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { DishType } from '../enums/dish-type.enum';
import { DishStatus } from '../enums/dish-status.enum';
import { DishesIncluded } from '../types/dishes-included.type';

export type DishDocument = Dish & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Dish {
  @Prop({ type: [Object], required: true })
  dishMenuIds: DishesIncluded[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Dish', required: false })
  complementOfDishId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order', required: true })
  orderId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  chefId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: DishType })
  type: DishType;

  @Prop({ type: Boolean, default: false })
  isAutoDelivered: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, type: Number })
  cost: number;

  @Prop({ type: Boolean })
  isComplementCoffe?: boolean;

  @Prop({ type: Number })
  kitchenIndex: number;

  @Prop({
    required: true,
    enum: DishStatus,
    default: DishStatus.IN_ROW,
  })
  status: DishStatus;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: String })
  conflictReason?: string;
}

export const DishSchema = SchemaFactory.createForClass(Dish);
