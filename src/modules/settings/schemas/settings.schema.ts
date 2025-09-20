import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Settings {
  @Prop({ required: true, type: Number })
  packagePrice: number;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
