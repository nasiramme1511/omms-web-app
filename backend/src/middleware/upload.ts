import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Set up storage logic
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureDir('uploads/receipts/');
        cb(null, 'uploads/receipts/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Create upload middleware, accepting a single image
export const uploadReceipt = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images (jpeg, jpg, png) are allowed!'));
    }
});

const generalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureDir('uploads/images/');
        cb(null, 'uploads/images/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const uploadImage = multer({
    storage: generalStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images are allowed!'));
    }
});
