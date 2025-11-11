const express = require('express');
const dotenv = require('dotenv');
// Don't use morgan in production environment
const morgan = require('morgan');
const cors = require('cors');
const errorMiddlewares = require('./middlewares/errorMiddleware');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
const userRoutes = require('./routes/userRoutes');
app.use("/api/users", userRoutes)
app.get('/', (req, res) => {
  res.json({ message: 'API is running smoothly 🚀' });
});

// 404 + Error handler
app.use(errorMiddlewares.notFound);
app.use(errorMiddlewares.errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});

