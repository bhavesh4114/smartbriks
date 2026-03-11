import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads/kyc');
const projectUploadDir = path.join(__dirname, '../uploads/projects');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(projectUploadDir)) {
  fs.mkdirSync(projectUploadDir, { recursive: true });
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

export const uploadKycDocuments = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
}).fields([
  { name: 'companyPanFile', maxCount: 1 },
  { name: 'gstCertificateFile', maxCount: 1 },
  { name: 'reraCertificateFile', maxCount: 1 },
  { name: 'cancelledChequeFile', maxCount: 1 },
  { name: 'idProofFile', maxCount: 1 },
  { name: 'selfieWithIdFile', maxCount: 1 },
]);

const projectStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, projectUploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || '.bin';
    const name = `project_${Date.now()}_${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, name);
  },
});

export const uploadProjectImages = multer({
  storage: projectStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
}).array('project_images', 10);

export const uploadInvestorKycDocuments = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
}).fields([
  { name: 'panCardFile', maxCount: 1 },
  { name: 'aadhaarFile', maxCount: 1 },
  { name: 'bankProofFile', maxCount: 1 },
  { name: 'selfieFile', maxCount: 1 },
]);
