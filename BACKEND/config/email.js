const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "info@outdidunified.com",
        pass: "yylh zjwo psvr slqb",
    },
});

const verifyEmailConnection = async () => {
    try {
        await transporter.verify();
        logger.info('Email service is ready to send emails');
        return true;
    } catch (error) {
        logger.error('Email service connection error:', error);
        return false;
    }
};

module.exports = {
    transporter,
    verifyEmailConnection
};
