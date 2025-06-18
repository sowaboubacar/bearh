import { Schema } from "joi";

/**
 * Validate data against a Joi schema
 *
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {object} data - Data object to validate
 * @returns {object} - Object containing errors and validated data
 * @example
 *
 * import validate from '~/core/utils/validate.server';
 * import Joi from 'joi';
 *
 * // Joi schema
 * const schema = Joi.object({
 *      email: Joi.string().email().required(),
 *      password: Joi.string().required(),
 * });
 *
 * // Data to validate
 * const dataToValidate = {
 *      email: 'example@example.com',
 *      password: 'password123',
 * };
 *
 * // Validate data against the schema
 * const { errors, data } = validate(schema, dataToValidate);
 * if (errors) {
 *      console.error(errors);
 * } else {
 *      console.log(data);
 * }
 */
export default function validate(schema: Schema, data: object) {
  const { value, error } = schema
    .prefs({ errors: { label: "key" }, abortEarly: false })
    .validate(data);

  if (error) {
    const errors = error.details.map((details) => details.message).join(", ");
    return { errors, data: null };
  }

  return { errors: null, data: value };
}
