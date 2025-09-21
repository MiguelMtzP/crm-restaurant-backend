import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const envConfiguration = registerAs('config', () => {
  return {
    environment: process.env.NODE_ENV || 'development',
    mongodb: {
      uri: process.env.MONGODB_URI || '',
      database: process.env.MONGODB_DATABASE || '',
    },
    jwt: {
      secret: process.env.JWT_SECRET || '',
      expirationTime: process.env.JWT_EXPIRATION || '1d',
    },
    port: parseInt(process.env.PORT || '3000', 10),
  };
});

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),
  MONGODB_URI: Joi.string().required(),
  MONGODB_DATABASE: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('1d'),
  PORT: Joi.number().default(3000),
});
