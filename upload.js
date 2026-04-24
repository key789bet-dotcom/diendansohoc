const multer = require('multer');
const path   = require('path');
const sharp  = require('sharp');
const fs     = require('fs');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|gif|webp/;
    const ok = types.test(path.extname(file.originalname).toLowerCase()) && types.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Chỉ chấp nhận file ảnh!'));
  }
});

async function saveAvatar(buffer, username) {
  const filename = `${username}_${Date.now()}.webp`;
  const filepath = `/var/www/diendansohoc/public/uploads/avatars/${filename}`;
  await sharp(buffer).resize(200, 200, { fit: 'cover' }).webp({ quality: 85 }).toFile(filepath);
  return `/uploads/avatars/${filename}`;
}

module.exports = { upload, saveAvatar };
