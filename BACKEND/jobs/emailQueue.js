const { transporter } = require('../config/email');
const logger = require('../middlewares/requestLogger');

class EmailQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    addJob(emailData) {
        this.queue.push({
            id: Date.now() + Math.random(),
            data: emailData,
            timestamp: new Date(),
            attempts: 0
        });
        
        logger.info(`Email job added to queue: ${emailData.type} to ${emailData.to}`);
        
        if (!this.processing) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }

        this.processing = true;
        const job = this.queue.shift();

        try {
            await this.sendEmail(job);
        } catch (error) {
            logger.error(`Email job ${job.id} failed:`, error);
            
            if (job.attempts < 3) {
                job.attempts++;
                this.queue.push(job);
                logger.info(`Email job ${job.id} requeued. Attempt ${job.attempts}/3`);
            } else {
                logger.error(`Email job ${job.id} permanently failed after 3 attempts`);
            }
        }

        setTimeout(() => this.processQueue(), 500);
    }

    async sendEmail(job) {
        const { data } = job;
        const mailOptions = {
            from: '"Water Purifier Service" <info@outdidunified.com>',
            to: data.to,
            subject: data.subject,
            html: data.html
        };

        logger.info(`Sending email: ${data.type} to ${data.to}`);
        
        const info = await transporter.sendMail(mailOptions);
        
        logger.info(`Email sent successfully: ${data.type} to ${data.to}`, {
            messageId: info.messageId,
            response: info.response
        });

        return info;
    }
}

const emailQueue = new EmailQueue();

module.exports = emailQueue;
