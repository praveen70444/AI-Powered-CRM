const path = require('path');
const fs = require('fs').promises;
const fileUploadService = require('../services/fileUploadService');

/**
 * Upload user avatar
 */
async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }
    
    const userId = req.user.userId;
    const fileUrl = fileUploadService.getFileUrl(req.file.filename, 'avatars');
    
    // Update user avatar
    const result = await fileUploadService.updateUserAvatar(userId, fileUrl);
    
    // Save file metadata
    await fileUploadService.saveFileMetadata({
      organizationId: req.user.organizationId,
      uploadedBy: userId,
      relatedType: 'user',
      relatedId: userId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl,
      isPublic: false,
    });
    
    res.json({
      success: true,
      data: {
        avatarUrl: fileUrl,
        uploadedAt: result.avatar_uploaded_at,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
    });
  }
}

/**
 * Upload organization logo
 */
async function uploadLogo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }
    
    const organizationId = req.user.organizationId;
    const fileUrl = fileUploadService.getFileUrl(req.file.filename, 'logos');
    
    // Update organization logo
    const result = await fileUploadService.updateOrganizationLogo(organizationId, fileUrl);
    
    // Save file metadata
    await fileUploadService.saveFileMetadata({
      organizationId,
      uploadedBy: req.user.userId,
      relatedType: 'organization',
      relatedId: organizationId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl,
      isPublic: false,
    });
    
    res.json({
      success: true,
      data: {
        logoUrl: fileUrl,
        uploadedAt: result.logo_uploaded_at,
      },
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
    });
  }
}

/**
 * Upload attachment
 */
async function uploadAttachment(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }
    
    const { relatedType, relatedId } = req.body;
    
    const fileUrl = fileUploadService.getFileUrl(req.file.filename, 'attachments');
    
    // Save file metadata
    const attachment = await fileUploadService.saveFileMetadata({
      organizationId: req.user.organizationId,
      uploadedBy: req.user.userId,
      relatedType,
      relatedId: relatedId ? parseInt(relatedId) : null,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl,
      isPublic: false,
    });
    
    res.json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    console.error('Attachment upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload attachment',
    });
  }
}

/**
 * Get attachments for an entity
 */
async function getAttachments(req, res) {
  try {
    const { relatedType, relatedId } = req.params;
    
    const attachments = await fileUploadService.getAttachmentsByEntity(
      relatedType,
      parseInt(relatedId),
      req.user.organizationId
    );
    
    res.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attachments',
    });
  }
}

/**
 * Delete attachment
 */
async function deleteAttachment(req, res) {
  try {
    const { attachmentId } = req.params;
    
    await fileUploadService.deleteAttachment(
      parseInt(attachmentId),
      req.user.organizationId
    );
    
    res.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete attachment',
    });
  }
}

/**
 * Serve file
 */
async function serveFile(req, res) {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(fileUploadService.uploadsDir, type, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve file',
    });
  }
}

module.exports = {
  uploadAvatar,
  uploadLogo,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
  serveFile,
};
