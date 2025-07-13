exports.verificationCodeTemplate = function (code) {
  return `
    <div style="font-family: sans-serif; line-height: 1.5; padding: 20px; background-color: #f8f8f8; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #4caf50;">Welcome to Chefio 👨‍🍳</h2>
        <p style="font-size: 16px;">Your verification code is:</p>
        <h1 style="font-size: 32px; color: #4caf50; letter-spacing: 2px;">${code}</h1>
        <p style="font-size: 14px; color: #888;">This code will expire in 5 minutes.</p>
        <p style="font-size: 14px;">If you did not request this code, you can safely ignore this email.</p>
        <br />
        <hr style="border: none; border-top: 1px solid #eee;" />
        <small style="font-size: 12px; color: #aaa;">Chefio Team • Please do not reply to this email</small>
      </div>
    </div>
  `;
};
