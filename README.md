# 🍳 Chefio - Recipe Sharing App

Chefio is a social recipe sharing application that allows users to explore new recipes, follow their favorite chefs, like recipes, and receive real-time notifications. Built with MERN Stack + Flutter with full support for authentication, notifications, deep linking, and multiple languages.

![Chefio Deployment](https://github.com/user-attachments/assets/d3f44375-a4e6-4a7d-b005-6a2b1444c073)

## 🚀 Features

### 🔐 Authentication & Authorization
- Sign up, login, logout, reset password
- Email verification (OTP)
- Google Login
- Access & Refresh Token system

### 📝 Recipes Management
- Create, edit, delete recipes with images, ingredients, steps
- Browse all recipes or filter by category
- Recipe details with likes, chef info, and shareable links
- Pagination, search, and sorting

### 👥 Social Features
- Follow/Unfollow chefs
- Like/Unlike recipes
- View followers and following lists
- Profile with uploaded and liked recipes

### 🔔 Notifications
- Push notifications via Firebase Cloud Messaging (FCM)
- Notifications for likes, follows, and new recipes
- Notifications screen

## 🛠️ Technologies

### Backend (Node.js + Express + MongoDB)
- **Runtime**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (Access & Refresh Tokens)
- **Email**: Nodemailer (for OTP & verification emails)
- **Notifications**: Firebase Admin SDK
- **Architecture**: Repository Pattern
- **Deployment**: Vercel

### Frontend (Flutter)
- **Framework**: Flutter
- **Storage**: Secure Token Storage (`flutter_secure_storage`)
- **API**: Interceptor with robust session management

## 📂 Project Structure (Backend - MVC)
chefio-backend/
│── app/
│ ├── config/ # Environment, DB connection
│ ├── controllers/ # Request handlers
│ ├── models/ # Mongoose models
│ ├── db/ # MongoDB connection
│ ├── routes/ # Express routes
│ ├── middlewares/ # Auth, error handling
│ ├── repositories/ # Data access layer
│ ├── services/ # Business logic
│ ├── helpers/ # Utility functions
│ └── app.js
│── package.json



## ⚡ Installation & Setup

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/abdelrhman-hegazy/chefio.git
cd chefio/backend
npm install
npm run dev


Create .env file:
# Server Configuration
NODE_ENV="development"
PORT="3000"
MONGO_URI="mongodb-URI"

# Authentication
ACCESS_TOKEN_SECRET="your-access-token-secret"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
TOKEN_SECRET="your-token-secret"
HMAC_VERIFICATION_CODE_SECRET="your-hmac-secret"

# Email Configuration
NODE_CODE_SENDING_EMAIL_ADDRESS="your-email@gmail.com"
NODE_CODE_SENDING_EMAIL_PASSWORD="your-app-password"

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Firebase (Notifications)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
FIREBASE_PRIVATE_KEY="your-private-key"

# Pexels API
PEXELS_API_KEY="your-pexels-api-key"

# Vercel Deployment
VERCEL_OIDC_TOKEN="your-vercel-token"


📸 Screenshots

<img width="1176" height="607" alt="chefio deployment" src="https://github.com/user-attachments/assets/d3f44375-a4e6-4a7d-b005-6a2b1444c073" />
<img width="1024" height="558" alt="chefio gemail" src="https://github.com/user-attachments/assets/1c465c89-3d7b-466d-b063-df4bc2c97781" />
<img width="1365" height="733" alt="chefio getRecipe" src="https://github.com/user-attachments/assets/ebd557c4-17a8-4065-86e0-e336af19b4c2" />
<img width="1365" height="730" alt="chefio sendverification" src="https://github.com/user-attachments/assets/b955c240-0f7b-4296-a979-c7de0a609af9" />
<img width="1365" height="731" alt="chefio signin" src="https://github.com/user-attachments/assets/dc95baca-7327-410c-a58d-0ff21cdb45ab" />
<img width="1365" height="731" alt="chefio signin1" src="https://github.com/user-attachments/assets/eb5b7828-dae5-46ab-8cc2-22a2256379cb" />


## 🤝 Collaboration

Built with ❤️ by:

abdelrhman-hegazy – Backend Developer 

Eslam-Hossam1 - Fluter

mahmoud-el-tohamy - frontend

AhmedMostafaAi - connect frontend by backend

