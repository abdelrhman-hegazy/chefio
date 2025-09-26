🍳 Chefio - Recipe Sharing App

Chefio هو تطبيق اجتماعي لمشاركة الوصفات، يتيح للمستخدمين استكشاف وصفات جديدة، متابعة الطهاة المفضلين لديهم، الإعجاب بالوصفات، واستقبال إشعارات لحظية.
تم بناؤه باستخدام MERN Stack + Flutter مع دعم كامل لـ authentication, notifications, deep linking, واللغات المتعددة.

🚀 Features

Authentication & Authorization

Sign up, login, logout, reset password

Email verification (OTP)

Google Login

Access & Refresh Token system

Recipes Create, edit, delete recipes with images, ingredients, steps

Browse all recipes or filter by category

Recipe details with likes, chef info, and shareable links

Pagination, search, and sorting

Social Features

Follow/Unfollow chefs

Like/Unlike recipes

View followers and following lists

Profile with uploaded and liked recipes

Notifications

Push notifications via Firebase Cloud Messaging (FCM)

Notifications for likes, follows, and new recipes

Notifications screen

🛠️ Technologies
Backend (Node.js + Express + MongoDB)

Node.js, Express.js

MongoDB + Mongoose

JWT Authentication (Access & Refresh Tokens)

Nodemailer (for OTP & verification emails)

Firebase Admin SDK (Push Notifications)

Repository Pattern

Deployed on Vercel

Secure Token Storage (flutter_secure_storage)

API Interceptor with robust session management

📂 Project Structure (Backend) MVC
chefio-backend/
│── app/
│   ├── config/         # Env, DB connection
│   ├── controllers/    # Request handlers
│   ├── models/         # Mongoose models'
│   ├── db/             # connect mongo
│   ├── routes/         # Express routes
│   ├── middlewares/    # Auth, error handling
│   ├── repositories/   # Data access layer
│   ├── services/       # Business logic
│   ├── helpers/        # Utility functions
│   └── app.js
│── package.json

⚡ Installation & Setup
Backend
git clone [https://github.com/a/chefio](https://github.com/abdelrhman-hegazy/chefio).git
cd chefio/backend
npm install
npm run dev


Create .env file:
NODE_ENV = "development"
ACCESS_TOKEN_SECRET="d4e5f6a7bfi6v8ce1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9fj1b2c3d4"
CLOUDINARY_API_KEY="833116568758478"
CLOUDINARY_API_SECRET="aeG2aBKU-1awy7I5odM-0gRiu2Q"
CLOUDINARY_CLOUD_NAME="dj3wmknwu"
FIREBASE_AUTH_PROVIDER_CERT_URL="https://www.googleapis.com/oauth2/v1/certs"
FIREBASE_AUTH_URI="https://accounts.google.com/o/oauth2/auth"
FIREBASE_CLIENT_CERT_URL="https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40chefio-f46be.iam.gserviceaccount.com"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@chefio-f46be.iam.gserviceaccount.com"
FIREBASE_CLIENT_ID="108524119665221064259"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDE0atTpVnDPd+H\nEIA6JmvjHWzQytgFFQi3GC8Jvk28zYKA+rk2j4wfDPD4Lvr7Xlogm2uqct8z0dcd\nl0FWmAp7tF5rKSJKENJSLT8DePPiwDPaSbtYaZ6nX5ZCPJ3yRlqCzVohbBBL/V0D\nJYB3zhdZUOLj3WjVWkKebGf+OdXL17TKeW7x0UATtO0z2pIX8jnU5qrBFuWH9PHd\nFG6ca9lNSWZ4C4tSlPQF6GeUGYjQ7TB9mU9SkcYsbP8W1h7Dt0JXZ3NHH0E10hzv\n4E3cEiwjj1Pc5z4K7DKl51YrqLNnzcBD7uyVFqC2seN2CXcAkS4OArn6kr2Q4VgD\nb8e9E6gFAgMBAAECggEAB+0gg7YntvoU0iLDFaE6r6mEANj/OYRfCfsFpe3nW1oO\nNLVXZFzQ+hnya5d+XXiV+gGYV+oK/Ov1+4fKxoev+f39EXHu7652vrJHLkbraq9u\nRyiFMxEDcsUhzxmtPx0M0LJTCQAjnEcGigJmhpMJRxXZVVWzPs7FDdraybCFk8Rr\n7AAmXOMr7AksXcyT35NAuMX0+JQtsIKiz2OgZwiaU9tWeCfNMvxoNNLaQzpmSLHE\n7elg/PJ3rOldso+mr4oZangx6aVnrsC/EDbHPp9hmLfqfRZPltVpnuIBnS7gGQCs\nkLD/6Vv+vCqbCqlheJ+yggHmESsBk/PZlfMRjvq0nwKBgQDoqSqeJ0yuymWz3gGI\nJDeeLcNkFKgE9aeG9iXyz6XT3XnADRd4lKZK1yzjsjsuAsU2Ph9dS6d0Za3EfC9G\nqSlIvGDll5edZgqmpO6wq/qKlSZyjFy4iVcCH1DMUPsFSQpNuJqMPoeQgOJ5dG6J\n1tmzzL5PMbUVV1vuSHOYKcMgPwKBgQDYkBHWjwb3naW+YH5ex3UrVuBL43Gxc8QK\nfvLtQmFEI3WvLVhBJU8zfrqEd1UdXnX1pHyQd2yy0AaCjXwX/tqp9zWAP3Cym4Zg\nZ5ySjCD1znlUcqeI/mL4QlbmbXtmTBUcammqoYGtshigHQ1+hRRqXdxh371uSJxl\nr43D9s5muwKBgB4t21ZaeKrvnBOhx4cWU5SUERVJTKYgC1QJV9DQOI1r3CAaUqIU\nfiGVGcCLXPvR5izsD/t1FcqWadzj0uoShUVnEhaV/FexZc5J9KA8HqqdQDh5loll\nX0DqOPvXwUflOo3sVTe94K3Q2g+xF6mPkfutoj35j6iuBUG6aiwhtqrXAoGBALZf\nLQZ40C86TVezPvhmE9/5e02tLhN4IAGOwtjW675L9lEdaJMD7ly5Pi1LqRvgbon8\niQHH8Hvs/25146j5b/9uNVnZEvj2TAVne81VwHP/+uEI5NlTENlsVG4ciKyvKaAS\nZQXSmLhDoMVFchW30Gd6v5qUppv2/e4MFuCOOWb9AoGBAKG6vy9ayWtFl2AlUlpS\nzCttzcYtuG0iqvxPTE8RD1EBJSfAeTYGsmJe2nYyT6PhZscJnQw+MScZPdhvdS1r\nABu0O/DA1XLxIR7utadXMaqIVGjUmvxZoX6sEi6pGOURLOxVoIW5ypgYuczXVPwv\nJVW3b08HzICZWZskS5lvbhk/\n-----END PRIVATE KEY-----\n"
FIREBASE_PRIVATE_KEY_ID="1e9d9caffd9acbc3423c2d685b79b9052beba17b"
FIREBASE_PROJECT_ID="chefio-f46be"
FIREBASE_TOKEN_URI="https://oauth2.googleapis.com/token"
FIREBASE_TYPE="service_account"
FIREBASE_UNIVERSE_DOMAIN="googleapis.com"
HMAC_VERIFICATION_CODE_SECRET="5a1f4b8c3e7d9a2f6b8c3e7d9a2f6b8c3e7d9a2f6b8c3e7d9a2f6b8c3e7d9a2f"
MONGO_URI="mongodb+srv://abdelrhmanHegazy:LPHK0Xcg8S0EF5tQ@nodeexpressprojects.88elr.mongodb.net/chefio?retryWrites=true&w=majority"
NODE_CODE_SENDING_EMAIL_ADDRESS="hegazy012075976@gmail.com"
NODE_CODE_SENDING_EMAIL_PASSWORD="uhrhtvkggskpabpo"
PEXELS_API_KEY="fhOendFR5ENjijCzqtI0kFc1x2aJCQsMydCKhfBfMxttcc7tsbRK6ge2"
PORT="3000"
REFRESH_TOKEN_SECRET="d4e5f6a7b8c9d0e1f2a3bfsgrg35634gdt4535f5e4d336c7d8e9f0a1b2c3d4"
TOKEN_SECRET="d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4"
VERCEL_OIDC_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay00MzAyZWMxYjY3MGY0OGE5OGFkNjFkYWRlNGEyM2JlNyJ9.eyJpc3MiOiJodHRwczovL29pZGMudmVyY2VsLmNvbS9hYmRlbHJobWFuLWhlZ2F6eXMtcHJvamVjdHMiLCJzdWIiOiJvd25lcjphYmRlbHJobWFuLWhlZ2F6eXMtcHJvamVjdHM6cHJvamVjdDpjaGVmaW86ZW52aXJvbm1lbnQ6ZGV2ZWxvcG1lbnQiLCJzY29wZSI6Im93bmVyOmFiZGVscmhtYW4taGVnYXp5cy1wcm9qZWN0czpwcm9qZWN0OmNoZWZpbzplbnZpcm9ubWVudDpkZXZlbG9wbWVudCIsImF1ZCI6Imh0dHBzOi8vdmVyY2VsLmNvbS9hYmRlbHJobWFuLWhlZ2F6eXMtcHJvamVjdHMiLCJvd25lciI6ImFiZGVscmhtYW4taGVnYXp5cy1wcm9qZWN0cyIsIm93bmVyX2lkIjoidGVhbV9qMnlTYmlsamdRZnU3RGJ3T2FFQkhZdHUiLCJwcm9qZWN0IjoiY2hlZmlvIiwicHJvamVjdF9pZCI6InByal9BT0Z0bm1kZ2xncUhDOUthcHR6V2FEeUNyWEY4IiwiZW52aXJvbm1lbnQiOiJkZXZlbG9wbWVudCIsInVzZXJfaWQiOiJ6d3dhck5mSXRMY25WeWVqbGRwQ0VHNEEiLCJuYmYiOjE3NTIzMDQwNTgsImlhdCI6MTc1MjMwNDA1OCwiZXhwIjoxNzUyMzQ3MjU4fQ.eHNtzoUef3NAeBVq-MmdybXBI-x4eTVzq6btntw7jHIwymVohB_nwJmOTJJMj0OOzuIDxH9eDPcEIaQxOCAksRUTxrg95keLFDNE97T9a0q3I2eO75cG0RH353Tt_rjIxaDXYu1nZwG4wHZTBbuytQtjh7-LneiHPueK1JTomi1v7_1B-wzWrKulnofSx1XXe5-Kdmuv7Ndon6s8-UnU50PaESd5ngriGGb1UP1g-21vJA1-NJr_ORUtZ6bSIq8qH4CcWaa-5fuTqFqO2EAKsFY7bDyuWrYm5AtnqhchzkN56GX_qJKMtQK69wMzVl9bRABpL-X6Fdlj4g7zAnIEAQ"


📸 Screenshots

<img width="1176" height="607" alt="chefio deployment" src="https://github.com/user-attachments/assets/d3f44375-a4e6-4a7d-b005-6a2b1444c073" />
<img width="1024" height="558" alt="chefio gemail" src="https://github.com/user-attachments/assets/1c465c89-3d7b-466d-b063-df4bc2c97781" />
<img width="1365" height="733" alt="chefio getRecipe" src="https://github.com/user-attachments/assets/ebd557c4-17a8-4065-86e0-e336af19b4c2" />
<img width="1365" height="730" alt="chefio sendverification" src="https://github.com/user-attachments/assets/b955c240-0f7b-4296-a979-c7de0a609af9" />
<img width="1365" height="731" alt="chefio signin" src="https://github.com/user-attachments/assets/dc95baca-7327-410c-a58d-0ff21cdb45ab" />
<img width="1365" height="731" alt="chefio signin1" src="https://github.com/user-attachments/assets/eb5b7828-dae5-46ab-8cc2-22a2256379cb" />


🤝 Collaboration

Built with ❤️ by:

abdelrhman-hegazy – Backend Developer 
Eslam-Hossam1 - Fluter
mahmoud-el-tohamy - frontend
AhmedMostafaAi - connect frontend by backend

