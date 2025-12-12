const jwt = require('jsonwebtoken');
const { getDB } = require('../../config/database');
const { sendLoginEmail } = require('../../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const db = getDB();
        const user = await db.collection('users').findOne({ 
            email: normalizedEmail,
            status: true 
        });

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        if (user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const token = jwt.sign({ 
            id: user._id.toString(), 
            roles: user.roles || [], 
            user_id: user.user_id, 
            email: user.email 
        }, JWT_SECRET, { expiresIn: '30d' });

        sendLoginEmail(user);

        const userResponse = {
            id: user._id,
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            number: user.number,
            roles: user.roles,
            role_names: user.role_names,
            address: user.address,
            created_at: user.created_at,
            modified_at: user.modified_at
        };

        if (user.distributor) {
            userResponse.distributor = user.distributor;
            userResponse.distributor_name = user.distributor_name;
        }

        if (user.local_distributor) {
            userResponse.local_distributor = user.local_distributor;
            userResponse.local_distributor_name = user.local_distributor_name;
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: userResponse
            }
        });
    } catch (error) {
        console.error('App login failed:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};

module.exports = {
    login
};
