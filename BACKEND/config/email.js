const nodemailer = require('nodemailer');

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
        console.log('Email service is ready to send emails');
        return true;
    } catch (error) {
        console.error('Email service connection error:', error);
        return false;
    }
};

module.exports = {
    transporter,
    verifyEmailConnection
};
