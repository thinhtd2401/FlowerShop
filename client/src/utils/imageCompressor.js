/**
 * utils/imageCompressor.js - Nén và resize ảnh phía client tiết kiệm RAM tối đa
 * Tối ưu đặc biệt cho thiết bị di động / máy tính bảng Android (như Samsung Tab A9)
 * Tránh OOM (Out Of Memory) crash tab bằng cách:
 * 1. Sử dụng createImageBitmap hardware resize nếu có hỗ trợ
 * 2. Giải phóng URL.revokeObjectURL & bitmap.close() ngay lập tức
 * 3. Thu dọn canvas dimensions (width=0, height=0) sau khi xuất Blob
 * 4. Xử lý tuần tự (Sequential) thay vì nén song song gây tràn RAM
 */

export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    mimeType = 'image/jpeg'
  } = options;

  if (!file) return file;

  const fileType = (file?.type || '').toLowerCase();
  const fileName = file?.name || `photo_${Date.now()}.jpg`;

  // Giữ nguyên GIF hoặc SVG
  if (fileType === 'image/gif' || fileType === 'image/svg+xml') {
    return file;
  }

  // 1. Thử nghiệm tối ưu phần cứng với createImageBitmap (Tiết kiệm >80% RAM trên Android Chrome)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      // Đọc kích thước ban đầu với ImageBitmap
      const initialBitmap = await createImageBitmap(file);
      let width = initialBitmap.width || 1200;
      let height = initialBitmap.height || 1200;
      initialBitmap.close(); // Giải phóng ngay bitmap ban đầu

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Resize trực tiếp ở tầng native/hardware
      const resizedBitmap = await createImageBitmap(file, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: 'medium'
      });

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(resizedBitmap, 0, 0);
        resizedBitmap.close(); // Đóng bitmap ngay sau khi vẽ

        const compressed = await new Promise((resolve) => {
          canvas.toBlob((blob) => {
            canvas.width = 0;
            canvas.height = 0;
            if (!blob) {
              resolve(file);
              return;
            }
            try {
              const baseName = fileName.replace(/\.[^/.]+$/, '') || `flower_${Date.now()}`;
              const newFile = new File([blob], `${baseName}.jpg`, {
                type: mimeType,
                lastModified: Date.now()
              });
              resolve(newFile.size < file.size ? newFile : file);
            } catch {
              resolve(blob || file);
            }
          }, mimeType, quality);
        });

        return compressed;
      }
      resizedBitmap.close();
    } catch (bitmapErr) {
      // Fallback về cơ chế Image() truyền thống nếu createImageBitmap không hỗ trợ định dạng
      console.warn('createImageBitmap fallback:', bitmapErr);
    }
  }

  // 2. Cơ chế Canvas HTMLImageElement Fallback
  return new Promise((resolve) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          if (objectUrl) URL.revokeObjectURL(objectUrl);

          let width = img.width || 1200;
          let height = img.height || 1200;

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
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              canvas.width = 0;
              canvas.height = 0;
              if (!blob) {
                resolve(file);
                return;
              }
              try {
                const baseName = fileName.replace(/\.[^/.]+$/, '') || `flower_${Date.now()}`;
                const compressedFile = new File([blob], `${baseName}.jpg`, {
                  type: mimeType,
                  lastModified: Date.now()
                });
                resolve(compressedFile.size < file.size ? compressedFile : file);
              } catch {
                resolve(blob || file);
              }
            },
            mimeType,
            quality
          );
        } catch (innerErr) {
          console.warn('Canvas resize fallback error:', innerErr);
          resolve(file);
        }
      };

      img.onerror = () => {
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch {}
        }
        resolve(file);
      };

      img.src = objectUrl;
    } catch (err) {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch {}
      }
      resolve(file);
    }
  });
}

/**
 * Nén mảng các file ảnh TUẦN TỰ (Sequential)
 * Tránh nén song song làm quá tải RAM của trình duyệt trên Android 4GB
 */
export async function compressImages(files, options = {}) {
  const fileArray = Array.from(files || []);
  const results = [];
  for (const file of fileArray) {
    const compressed = await compressImage(file, options);
    results.push(compressed);
  }
  return results;
}
