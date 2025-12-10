const express = require('express');
const cors = require('cors');
const { setupSwagger } = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const pagination = require('./middleware/pagination');
const logger = require('./middlewares/requestLogger');

const adminAuthRoutes = require('./routes/admin/adminAuthRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const appAuthRoutes = require('./routes/app/appAuthRoutes');
const appRoutes = require('./routes/app/appRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
