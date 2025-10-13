# 🍳 Chefio - Recipe Sharing Platform

Chefio is a comprehensive social recipe sharing application that enables users to discover, create, and share culinary experiences. Built with modern technologies including MERN stack and Flutter, featuring real-time notifications, multi-language support, and seamless user interactions.
### deployment in vercel
![Chefio Banner](https://github.com/user-attachments/assets/d3f44375-a4e6-4a7d-b005-6a2b1444c073)

### send verification code gmail
![Chefio Banner](https://github.com/user-attachments/assets/1c465c89-3d7b-466d-b063-df4bc2c97781)

## ✨ Key Features

### 🔐 Secure Authentication
- **User Registration & Login** with email verification
- **Google OAuth Integration** for seamless sign-in
- **JWT Token System** with access and refresh tokens
- **Password Reset** functionality with OTP verification
- **Secure Session Management** across devices

### 📚 Recipe Management
- **Create & Edit Recipes** with rich media support
- **Ingredient & Step Management** with intuitive interfaces
- **Advanced Filtering** by categories, ingredients, and dietary preferences
- **Recipe Discovery** with smart search and recommendations
- **High-Quality Images** powered by Cloudinary integration

### 👥 Social Interactions
- **Follow/Unfollow System** for chefs and food enthusiasts
- **Like & Bookmark** your favorite recipes
- **Social Profiles** with activity feeds and statistics
- **Community Engagement** through comments and ratings
- **Share Recipes** across social media platforms

### 🔔 Real-time Notifications
- **Push Notifications** via Firebase Cloud Messaging
- **Instant Alerts** for likes, follows, and new recipes
- **Custom Notification Center** with management options
- **Multi-channel Delivery** including email and in-app

## 🛠 Technology Stack

### Backend Architecture
- **Runtime Environment**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with secure token rotation
- **File Storage**: Cloudinary for image and media management
- **Email Service**: Nodemailer with OTP verification
- **Push Notifications**: Firebase Admin SDK
- **API Design**: RESTful principles with proper status codes

### Frontend & Mobile
- **Mobile App**: Flutter with responsive design
- **State Management**: Provider/Riverpod for state handling
- **Local Storage**: Flutter Secure Storage for sensitive data
- **HTTP Client**: Dio with interceptors and error handling
- **Internationalization**: Full multi-language support

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account or local MongoDB
- Flutter SDK for mobile development

### Backend Installation

### 📸 Screenshots

<img width="1176" height="607" alt="chefio deployment" src="https://github.com/user-attachments/assets/d3f44375-a4e6-4a7d-b005-6a2b1444c073" />
<img width="1024" height="558" alt="chefio gmail" src="https://github.com/user-attachments/assets/1c465c89-3d7b-466d-b063-df4bc2c97781" />
<img width="1365" height="733" alt="chefio getRecipe" src="https://github.com/user-attachments/assets/ebd557c4-17a8-4065-86e0-e336af19b4c2" />
<img width="1365" height="730" alt="chefio sendverification" src="https://github.com/user-attachments/assets/b955c240-0f7b-4296-a979-c7de0a609af9" />
<img width="1365" height="731" alt="chefio signin" src="https://github.com/user-attachments/assets/dc95baca-7327-410c-a58d-0ff21cdb45ab" />
<img width="1365" height="731" alt="chefio signin1" src="https://github.com/user-attachments/assets/eb5b7828-dae5-46ab-8cc2-22a2256379cb" />



1. **Clone and Setup**
```bash
git clone https://github.com/abdelrhman-hegazy/chefio.git
cd chefio/backend
npm install
npm run dev
# Server Configuration
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chefio

# Security & Authentication
ACCESS_TOKEN_SECRET=your_secure_access_token_secret_here
REFRESH_TOKEN_SECRET=your_secure_refresh_token_secret_here
TOKEN_SECRET=your_secure_token_secret_here
HMAC_VERIFICATION_CODE_SECRET=your_hmac_secret_here

# External Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

PEXELS_API_KEY=your_pexels_api_key

# Email Service
NODE_CODE_SENDING_EMAIL_ADDRESS=your_email@gmail.com
NODE_CODE_SENDING_EMAIL_PASSWORD=your_app_password
```
## 🤝 Collaboration

Built with ❤️ by:

abdelrhman-hegazy – Backend Developer 

Eslam-Hossam1 - Fluter

mahmoud-el-tohamy - frontend

AhmedMostafaAi - connect frontend by backend

