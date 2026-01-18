# 🚀 Micro-Earning Platform Backend

The engine powering the Micro-Earning ecosystem. This server handles authentication, secure task submissions, financial transactions via Stripe, and real-time notifications via Firebase.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js (v5+)
- **Database**: MongoDB with Mongoose
- **Identity & Notifications**: Firebase Admin SDK
- **Payments**: Stripe API
- **Security**: JWT & Bcryptjs

## 📦 Project Structure

```text
server/
├── src/
│   ├── controllers/    # Business logic for each resource
│   ├── models/         # Mongoose schemas (User, Task, Submission, etc.)
│   ├── routes/         # API endpoint definitions
│   ├── middleware/      # Auth, Role-based access, and Validation
│   ├── utils/          # Helpers (Notifications, Cloudinary, etc.)
│   └── server.js       # Entry point
├── .env                # Environment configuration
└── package.json        # Dependencies and scripts
```

## ⚙️ Environment Configuration

Create a `.env` file in the root of the `/server` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_ultra_secure_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLIENT_URL=http://localhost:5173
```

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup**:
   Ensure your MongoDB instance is running or use a MongoDB Atlas connection string.

3. **Firebase Integration**:
   Place your `serviceAccountKey.json` in the root of the server folder for notification support.

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```

## 🛣 API Endpoints

| Endpoint | Description | Access |
| :--- | :--- | :--- |
| `POST /api/auth/register` | User Registration | Public |
| `POST /api/auth/login` | User Authentication | Public |
| `GET /api/tasks` | Fetch available tasks | Worker/Buyer |
| `POST /api/submissions` | Submit task proof | Worker |
| `PATCH /api/submissions/:id/status` | Approve/Reject proof| Buyer/Admin |
| `POST /api/payments/create-intent` | Stripe coin purchase | Buyer |
| `GET /api/withdrawals/worker/my-withdrawals`| Fetch payout history| Worker |

## 🛠 Available Scripts

- `npm start`: Standard production start.
- `npm run dev`: Development mode with `--watch` flag.
- `node create_admin.js`: Utility to initialize the first platform administrator.
- `node seed_tasks.js`: Populates the database with demo micro-tasks.

---
*Built with ❤️ for High-Performance Micro-Earning Applications.*
