import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Required in all environments
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development')
    .messages({
      'any.only': 'NODE_ENV must be one of: development, test, production',
    }),

  PORT: Joi.number().default(3000).messages({
    'number.base': 'PORT must be a number',
  }),

  // Required in production only
  DATABASE_URL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required().messages({
      'any.required':
        'DATABASE_URL is required in production (should be injected from Azure Key Vault)',
    }),
    otherwise: Joi.optional(),
  }),

  CORS_ORIGIN: Joi.string().default('http://localhost:5173').messages({
    'string.base': 'CORS_ORIGIN must be a string URL',
  }),

  // Optional (for future use)
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required().messages({
      'any.required':
        'JWT_SECRET is required in production (should be injected from Azure Key Vault)',
    }),
    otherwise: Joi.optional().default('dev-secret'),
  }),

  API_KEY: Joi.string().optional(),
}).options({
  abortEarly: false, // Show all validation errors, not just the first one
});
