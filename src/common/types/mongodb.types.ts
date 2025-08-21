import { Document, Types } from 'mongoose';

export type ObjectId = Types.ObjectId;

export interface BaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}
