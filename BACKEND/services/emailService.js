const emailQueue = require('../jobs/emailQueue');

const sendLoginEmail = (user) => {
    const emailData = {
        type: 'LOGIN',
        to: user.email,
        subject: 'New Login to Your Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Login Notification</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>We detected a new login to your Water Purifier Service account.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Login Details:</strong></p>
                    <p>Email: ${user.email}</p>
                    <p>Time: ${new Date().toLocaleString()}</p>
                    <p>User ID: ${user.user_id}</p>
                </div>
                <p>If this wasn't you, please contact support immediately.</p>
                <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="color: #7f8c8d; font-size: 12px;">
                    This is an automated email from Water Purifier Service. Please do not reply to this email.
                </p>
            </div>
        `
    };
    
    emailQueue.addJob(emailData);
};

const sendUserCreatedEmail = (user, createdBy) => {
    const emailData = {
        type: 'USER_CREATED',
        to: user.email,
        subject: 'Welcome to Water Purifier Service',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #27ae60;">Welcome to Water Purifier Service!</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>Your account has been successfully created.</p>
                <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Account Details:</strong></p>
                    <p>Name: ${user.name}</p>
                    <p>Email: ${user.email}</p>
                    <p>Phone: ${user.number || 'Not provided'}</p>
                    <p>User ID: ${user.user_id}</p>
                    <p>Roles: ${user.role_names ? user.role_names.join(', ') : 'N/A'}</p>
                    ${user.address ? `
                        <p>Address: ${user.address.doorno || ''} ${user.address.street || ''}, 
                        ${user.address.city || ''}, ${user.address.state || ''} - ${user.address.pincode || ''}</p>
                    ` : ''}
                </div>
                <p><strong>Created by:</strong> ${createdBy}</p>
                <p><strong>Created at:</strong> ${new Date().toLocaleString()}</p>
                <p>You can now log in to your account using your email and password.</p>
                <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="color: #7f8c8d; font-size: 12px;">
                    This is an automated email from Water Purifier Service. Please do not reply to this email.
                </p>
            </div>
        `
    };
    
    emailQueue.addJob(emailData);
};

const sendProfileUpdatedEmail = (user, updatedFields) => {
    const fieldsList = Object.keys(updatedFields)
        .filter(key => key !== 'modified_by' && key !== 'modified_at' && key !== 'password')
        .map(key => {
            if (key === 'address') {
                return `<li>Address updated</li>`;
            }
            return `<li>${key.replace(/_/g, ' ').toUpperCase()}</li>`;
        })
        .join('');

    const emailData = {
        type: 'PROFILE_UPDATED',
        to: user.email,
        subject: 'Your Profile Has Been Updated',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3498db;">Profile Update Notification</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>Your profile has been updated successfully.</p>
                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Updated Fields:</strong></p>
                    <ul style="margin: 10px 0;">
                        ${fieldsList}
                    </ul>
                    <p><strong>Updated at:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Updated by:</strong> ${updatedFields.modified_by || 'Self'}</p>
                </div>
                <p>If you didn't make these changes, please contact support immediately.</p>
                <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="color: #7f8c8d; font-size: 12px;">
                    This is an automated email from Water Purifier Service. Please do not reply to this email.
                </p>
            </div>
        `
    };
    
    emailQueue.addJob(emailData);
};

module.exports = {
    sendLoginEmail,
    sendUserCreatedEmail,
    sendProfileUpdatedEmail
};
