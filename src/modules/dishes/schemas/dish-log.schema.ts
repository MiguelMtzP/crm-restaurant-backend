import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { DishLogAction } from '../enums/dish-log-action.enum';

export type DishLogDocument = DishLog & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class DishLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Dish', required: true })
  dishId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: DishLogAction })
  actionType: DishLogAction;

  @Prop({ required: true })
  value: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;
}

export const DishLogSchema = SchemaFactory.createForClass(DishLog);
