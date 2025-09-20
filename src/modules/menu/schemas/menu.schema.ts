import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MenuSource } from '../enums/menu-source.enum';
import { MenuAttribute } from '../types/menu-attribute.type';

export type MenuDocument = Menu & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Menu {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: Boolean, default: false })
  isAutoDelivered: boolean;

  @Prop({ required: true, enum: MenuSource })
  source: MenuSource;

  @Prop({ type: [Object], required: true })
  attributes: MenuAttribute[];

  @Prop({ required: true, type: Number })
  cost: number;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
