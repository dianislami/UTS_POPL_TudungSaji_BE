# Backend API - Tudung Saji

Backend API untuk aplikasi Tudung Saji yang dibangun dengan Node.js, Express.js, dan MongoDB.

## 🚀 Features

- ✅ User Authentication (Register & Login)
- ✅ JWT Token-based Authentication
- ✅ Password Hashing dengan bcrypt
- ✅ MongoDB Database Integration
- ✅ CORS Support untuk Frontend
- ✅ Environment Variables Configuration

## 🛠️ Tech Stack

- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password Hashing
- **CORS** - Cross-Origin Resource Sharing

## 📁 Project Structure

```
BE_tudungsaji/
├── models/
│   └── User.js          # User schema
├── routes/
│   └── auth.js          # Authentication routes
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies & scripts
├── server.js           # Main server file
└── README.md           # Documentation
```

## ⚙️ Installation & Setup

1. **Clone repository**
```bash
git clone <repository-url>
cd BE_tudungsaji
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update MongoDB connection string
   - Set JWT secret

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tudungsaji
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

4. **Run Development Server**
```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | User Registration | `{ name, email, password }` |
| POST | `/api/auth/login` | User Login | `{ email, password }` |

### Example Requests

**Register User:**
```json
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login User:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

## 🔒 Environment Variables

Create `.env` file dengan variabel berikut:

```env
MONGODB_URI=mongodb://localhost:27017/tudungsaji
JWT_SECRET=your-jwt-secret-key
PORT=5000
```

## 🚀 Deployment

Backend ini siap untuk deploy ke:
- **Heroku**
- **Railway**
- **Render**
- **DigitalOcean**

## 📝 Scripts

```bash
npm start          # Production server
npm run dev        # Development server dengan nodemon
npm test          # Run tests (belum implemented)
```

## 🤝 Frontend Integration

Backend ini dirancang untuk bekerja dengan frontend React di repository terpisah.

Frontend URL: `http://localhost:3000` (development)

## 📄 License

MIT License

## 👨‍💻 Developer

Developed for POPL UTS Project