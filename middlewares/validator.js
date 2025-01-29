const joi = require("joi");

const signupSchema = joi.object({
  username: joi
    .string()
    .min(2)
    .required()
    .pattern(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{2,19}$")),
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({ tlds: { allow: ["com", "net"] } }),
  password: joi
    .string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*d).{8,}$")),
});

const signinSchema = joi.object({
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({ tlds: { allow: ["com", "net"] } }),
  password: joi
    .string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*d).{8,}$")),
});

const accesptCodeSchema = joi.object({
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({ tlds: { allow: ["com", "net"] } }),
  providedCode: joi.number().required(),
});

module.exports = { signinSchema, signupSchema, accesptCodeSchema };
