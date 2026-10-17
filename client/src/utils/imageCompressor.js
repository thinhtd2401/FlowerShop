/**
 * utils/imageCompressor.js - Nén và resize ảnh phía client trước khi upload
 * Giúp tối ưu hóa dung lượng ảnh chụp từ camera điện thoại (từ 5-10MB xuống ~200KB)
 * Giữ nguyên độ sắc nét chi tiết hoa tươi mà upload cực nhanh.
 */

export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    mimeType = 'image/jpeg'
  } = options;

  // Kiểm tra an toàn xem có phải file hình ảnh hoặc camera blob không
  const fileType = (file?.type || '').toLowerCase();
  const fileName = file?.name || `photo_${Date.now()}.jpg`;

  // Nếu là GIF hoặc SVG, giữ nguyên để không mất animation / vector
  if (fileType === 'image/gif' || fileType === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);

          let width = img.width || 1200;
          let height = img.height || 1200;

          // Tính toán kích thước mới theo tỉ lệ chuẩn
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }

              try {
                // Đổi đuôi mở rộng file thành .jpg an toàn
                const baseName = fileName.replace(/\.[^/.]+$/, '') || `flower_${Date.now()}`;
                const newName = `${baseName}.jpg`;
                const compressedFile = new File([blob], newName, {
                  type: mimeType,
                  lastModified: Date.now()
                });

                resolve(compressedFile.size < file.size ? compressedFile : file);
              } catch {
                // Fallback nếu constructor File không được hỗ trợ trên WebView cũ
                resolve(blob || file);
              }
            },
            mimeType,
            quality
          );
        } catch (innerErr) {
          console.warn('Canvas resize error, fallback to raw file:', innerErr);
          resolve(file);
        }
      };

      img.onerror = () => {
        try { URL.revokeObjectURL(objectUrl); } catch {}
        resolve(file);
      };

      img.src = objectUrl;
    } catch (err) {
      console.warn('URL.createObjectURL failed, fallback to raw file:', err);
      resolve(file);
    }
  });
}

export async function compressImages(files, options = {}) {
  const fileArray = Array.from(files || []);
  return Promise.all(fileArray.map((f) => compressImage(f, options)));
}
