const express = require('express');
const dotenv = require('dotenv');
// Don't use morgan in production environment
const morgan = require('morgan');
const cors = require('cors');
const errorMiddlewares = require('./middlewares/errorMiddleware');
const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const cookieParser = require('cookie-parser');

dotenv.config();
connectDB();

const app = express();
app.use(cookieParser());

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
// Task Routes
app.use('/api/tasks', taskRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.json({ message: 'API is running smoothly 🚀' });
});

// Error Handling Middlewares
app.use(errorMiddlewares.notFound);
app.use(errorMiddlewares.errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
