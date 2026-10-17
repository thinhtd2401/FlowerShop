/**
 * routes/upload.js - Image upload handler using Multer
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `flower-${uniqueSuffix}${ext.toLowerCase()}`);
  }
});

// File filter: accept images (including Android / Samsung octet-stream / no-ext camera blobs)
const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = (path.extname(file.originalname || '') || '').toLowerCase();
  const validImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.bmp'];

  // Chấp nhận nếu mimetype là image/* HOẶC có đuôi mở rộng ảnh HOẶC là file stream từ camera
  if (
    mime.startsWith('image/') ||
    validImageExts.includes(ext) ||
    mime === 'application/octet-stream' ||
    !mime
  ) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max per image
  }
}).array('images', 10);

// POST /api/upload - Upload 1 hoặc nhiều ảnh (tối đa 10 ảnh) với error handling an toàn
router.post('/', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error('⚠️ Multer upload error:', err.message);
      return res.status(400).json({ error: err.message || 'Lỗi khi tải ảnh lên' });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Không có ảnh nào được gửi lên' });
      }

      const files = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname || file.filename,
        size: file.size
      }));

      res.json({
        success: true,
        files,
        urls: files.map(f => f.url)
      });
    } catch (innerErr) {
      res.status(500).json({ error: innerErr.message });
    }
  });
});

// DELETE /api/upload/:filename - Xóa file ảnh vật lý nếu cần
router.delete('/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true, message: 'Đã xóa file ảnh' });
    }

    res.status(404).json({ error: 'Không tìm thấy file ảnh' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
