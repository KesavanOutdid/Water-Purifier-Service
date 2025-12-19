const express = require('express');
const cors = require('cors');
const path = require('path');
const { setupSwagger } = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const pagination = require('./middleware/pagination');
const logger = require('./middlewares/requestLogger');

const adminAuthRoutes = require('./routes/admin/adminAuthRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const appAuthRoutes = require('./routes/app/appAuthRoutes');
const appRoutes = require('./routes/app/appRoutes');

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://192.168.192.1:3000',
      'http://192.168.0.40:3000',
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

setupSwagger(app);

app.use(pagination);

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/app/auth', appAuthRoutes);
app.use('/api/app', appRoutes);

app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Water Purifier Service API',
        version: '1.0.0',
        documentation: '/api-docs'
    });
});

app.use(errorHandler);

module.exports = app;
