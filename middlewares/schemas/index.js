const joi = require("joi");
const usernameJoi = joi.string().min(2).required();

const emailJoi = joi
  .string()
  .min(6)
  .max(60)
  .required()
  .email({ tlds: { allow: ["com", "net","me"] } });

const passwordJoi = joi
  .string()
  .required()
  .pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!^%*?#&])[A-Za-z\d@$!%#*?&]{8,}$/
  );

// const recipeSchemAll =
// validated recipe schema
const recipeSchema = joi.object({
  foodName: joi.string().min(2).max(50).trim().required(),
  description: joi.string().min(3).max(500).trim().required(),
  cookingDuration: joi.number().required(),
  ingredients: joi.array().items(joi.string().trim()).min(2).max(20).required(),
  categoryId: joi.string().optional(),
  steps: joi
    .array()
    .items(
      joi.object({
        step: joi.string().min(2).max(500).required(),
        stepImage: joi.string().optional(),
      })
    )
    .min(1)
    .required(),
});
const recipeUpdateSchema = joi.object({
  foodName: joi.string().min(2).max(50).trim().optional(),
  description: joi.string().min(3).max(500).trim().optional(),
  cookingDuration: joi.number().optional(),
  ingredients: joi.array().items(joi.string().trim()).min(2).max(20).optional(),
  categoryId: joi.string().optional(),
  steps: joi
    .array()
    .items(
      joi.object({
        step: joi.string().min(2).max(500).required(),
        stepImage: joi.string().optional(),
      })  
    )
    .optional(),
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
const googleSigninSchema = joi.object({
  //googleId: uniqeu google id
  googleId: joi.string().required(),
  email: emailJoi,
  username: usernameJoi,
  profilePicture: joi.string().optional(),
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
  googleSigninSchema,
};
