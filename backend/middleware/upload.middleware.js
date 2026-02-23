import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads/kyc');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || '.bin';
    const name = `builder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, name);
  },
});

export const uploadKycDocument = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('documentImage');
