const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories
const dirs = ['avatars', 'logos', 'attachments'];
dirs.forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.uploadType || 'attachments';
    cb(null, path.join(uploadsDir, uploadType));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter for validation
 */
const fileFilter = (req, file, cb) => {
  // Allow images and common document types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
  }
};

/**
 * Create multer upload middleware
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Save file metadata to database
 */
async function saveFileMetadata({
  organizationId,
  uploadedBy,
  relatedType,
  relatedId,
  fileName,
  fileType,
  fileSize,
  fileUrl,
  storageProvider = 'local',
  isPublic = false,
}) {
  const query = `
    INSERT INTO attachments (
      organization_id, uploaded_by, related_type, related_id,
      file_name, file_type, file_size, file_url,
      storage_provider, is_public
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const values = [
    organizationId,
    uploadedBy,
    relatedType || null,
    relatedId || null,
    fileName,
    fileType,
    fileSize,
    fileUrl,
    storageProvider,
    isPublic,
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get file URL (for serving)
 */
function getFileUrl(filename, type = 'attachments') {
  return `/api/files/${type}/${filename}`;
}

/**
 * Delete file from filesystem
 */
function deleteFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get attachment by ID
 */
async function getAttachmentById(attachmentId, organizationId) {
  const query = `
    SELECT * FROM attachments
    WHERE id = $1 AND organization_id = $2
  `;
  
  const result = await pool.query(query, [attachmentId, organizationId]);
  return result.rows[0];
}

/**
 * Get attachments for an entity
 */
async function getAttachmentsByEntity(relatedType, relatedId, organizationId) {
  const query = `
    SELECT a.*, u.name as uploader_name
    FROM attachments a
    LEFT JOIN users u ON a.uploaded_by = u.id
    WHERE a.related_type = $1 AND a.related_id = $2 AND a.organization_id = $3
    ORDER BY a.created_at DESC
  `;
  
  const result = await pool.query(query, [relatedType, relatedId, organizationId]);
  return result.rows;
}

/**
 * Delete attachment
 */
async function deleteAttachment(attachmentId, organizationId) {
  // Get attachment info first
  const attachment = await getAttachmentById(attachmentId, organizationId);
  
  if (!attachment) {
    throw new Error('Attachment not found');
  }
  
  // Delete from filesystem
  const filePath = path.join(uploadsDir, attachment.file_url.replace('/api/files/', ''));
  await deleteFile(filePath);
  
  // Delete from database
  const query = 'DELETE FROM attachments WHERE id = $1 AND organization_id = $2';
  await pool.query(query, [attachmentId, organizationId]);
  
  return { success: true };
}

/**
 * Update user avatar
 */
async function updateUserAvatar(userId, avatarUrl) {
  const query = `
    UPDATE users
    SET avatar_url = $1, avatar_uploaded_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, avatar_url, avatar_uploaded_at
  `;
  
  const result = await pool.query(query, [avatarUrl, userId]);
  return result.rows[0];
}

/**
 * Update organization logo
 */
async function updateOrganizationLogo(organizationId, logoUrl) {
  const query = `
    UPDATE organizations
    SET logo_url = $1, logo_uploaded_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, logo_url, logo_uploaded_at
  `;
  
  const result = await pool.query(query, [logoUrl, organizationId]);
  return result.rows[0];
}

module.exports = {
  upload,
  saveFileMetadata,
  getFileUrl,
  deleteFile,
  getAttachmentById,
  getAttachmentsByEntity,
  deleteAttachment,
  updateUserAvatar,
  updateOrganizationLogo,
  uploadsDir,
};
