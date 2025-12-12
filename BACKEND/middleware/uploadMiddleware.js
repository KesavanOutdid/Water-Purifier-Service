const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const profilePicsDir = path.join(uploadDir, 'profile-pics');
if (!fs.existsSync(profilePicsDir)) {
    fs.mkdirSync(profilePicsDir, { recursive: true });
}

const taskPhotosDir = path.join(uploadDir, 'task-photos');
if (!fs.existsSync(taskPhotosDir)) {
    fs.mkdirSync(taskPhotosDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and PDF files are allowed'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

const profilePicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profilePicsDir);
    },
    filename: (req, file, cb) => {
        const user_id = req.user_id;
        if (!user_id) {
            return cb(new Error('User ID is required for profile picture upload'));
        }
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${user_id}${ext}`);
    }
});

const profilePicFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp|tiff|tif|heic|heif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed for profile pictures'));
    }
};

const uploadProfilePic = multer({
    storage: profilePicStorage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: profilePicFilter
});

const taskPhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, taskPhotosDir);
    },
    filename: (req, file, cb) => {
        const { task_id } = req.params;
        if (!task_id) {
            return cb(new Error('Task ID is required for photo upload'));
        }
        const timestamp = Date.now();
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${task_id}_${timestamp}${ext}`);
    }
});

const taskPhotoFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed for task photos'));
    }
};

const uploadTaskPhotos = multer({
    storage: taskPhotoStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: taskPhotoFilter
});

module.exports = {
    upload,
    uploadProfilePic,
    uploadTaskPhotos
};
