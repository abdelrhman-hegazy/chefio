const joi = require("joi");
const usernameJoi = joi.string().min(2).required();

const emailJoi = joi
  .string()
  .min(6)
  .max(60)
  .required()
  .email({ tlds: { allow: ["com", "net"] } });

const passwordJoi = joi
  .string()
  .required()
  .pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!^%*?#&])[A-Za-z\d@$!%#*?&]{8,}$/
  );

// validated recipe schema
const recipeSchema = joi.object({
  foodName: joi.string().min(3).max(50).trim().required(),
  description: joi.string().min(3).max(500).trim().required(),
  cookingDuration: joi.number().min(5).max(300).required(),
  ingredients: joi.array().items(joi.string().trim()).min(2).max(20).required(),
  steps: joi.array().items(joi.string().trim()).min(2).max(20).required(),
});
const recipeUpdateSchema = joi.object({
  foodName: joi.string().min(3).max(50).trim().optional(),
  description: joi.string().min(3).max(500).trim().optional(),
  cookingDuration: joi.number().min(5).max(300).optional(),
  ingredients: joi.array().items(joi.string().trim()).min(2).max(20).optional(),
  steps: joi.array().items(joi.string().trim()).min(2).max(20).optional(),
});
const signupSchema = joi.object({
  username: usernameJoi,
  email: emailJoi,
  password: passwordJoi,
});

const signinSchema = joi.object({
  email: emailJoi,
  password: passwordJoi,
});

const accesptCodeSchema = joi.object({
  email: emailJoi,
  providedCode: joi.number().required(),
});
const changePasswordSchema = joi.object({
  oldPassword: passwordJoi,
  newPassword: passwordJoi,
});
const acceptEmailSchema = joi.object({
  email: emailJoi,
});
const acceptResetPasswordSchema = joi.object({
  email: emailJoi,
  newPassword: passwordJoi,
});

module.exports = {
  signinSchema,
  signupSchema,
  accesptCodeSchema,
  changePasswordSchema,
  acceptEmailSchema,
  acceptResetPasswordSchema,
  recipeSchema,
  recipeUpdateSchema,
};
