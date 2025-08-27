import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Required in all environments
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  
  PORT: Joi.number()
    .default(3000),
  
  // Required in production only
  DATABASE_URL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:5173'),
  
  // Optional (for future use)
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().default('dev-secret'),
  }),
  
  API_KEY: Joi.string().optional(),
});