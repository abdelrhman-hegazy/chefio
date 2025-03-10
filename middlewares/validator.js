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
    foodName: joi.string().min(3).required(),
    description: joi.string().min(3).required(),
    cookingDuration: joi.string().required(),
    ingredients: joi.array().items(joi.string().min(3)).required(),
    steps: joi.array().items(joi.string().min(3)).required(),
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
    recipeSchema
  };
