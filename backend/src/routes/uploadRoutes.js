// backend/src/routes/uploadRoutes.js
import express from 'express';
import upload from '../config/uploadConfig.js';
import { deleteImage } from '../config/cloudinary.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();


// Rota para upload de múltiplas imagens
router.post('/images', authMiddleware, (req, res) => {
  // Usar multer como middleware
  upload.array('images', 10)(req, res, async (err) => {
    if (err) {
      logger.error('uploadRoutes: Upload error', { error: err.message, code: err.code });

      // Log de auditoria para falha de upload
      logger.warn('AUDIT_UPLOAD_FAILED', {
        action: 'image_upload_failed',
        userId: req.user?.id,
        userRole: req.user?.role,
        error: err.message,
        code: err.code,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      // Tratar erro de arquivo muito grande
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Arquivo muito grande. O tamanho máximo permitido é 5MB por imagem.'
        });
      }

      // Tratar erro de muitos arquivos
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({
          error: 'Muitos arquivos. O máximo permitido é 10 imagens por upload.'
        });
      }

      // Outros erros do multer
      return res.status(400).json({
        error: err.message || 'Erro no processamento do arquivo'
      });
    }

    try {
      if (!req.files || req.files.length === 0) {
        logger.warn('uploadRoutes: No files uploaded');
        return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
      }

      logger.info('uploadRoutes: Processing uploaded files', {
        count: req.files.length,
        userId: req.user?.id
      });

      // Retornar URLs das imagens do Cloudinary
      const imageUrls = req.files.map(file => file.path);

      // Log de auditoria para uploads
      logger.info('AUDIT_UPLOAD_SUCCESS', {
        action: 'image_upload',
        userId: req.user?.id,
        userRole: req.user?.role,
        uploadedCount: req.files.length,
        totalSize: req.files.reduce((sum, file) => sum + file.size, 0),
        files: req.files.map(file => ({
          originalName: file.originalname,
          publicId: file.filename,
          url: file.path,
          size: file.size,
          mimetype: file.mimetype
        })),
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: `${req.files.length} imagem(ns) enviada(s) com sucesso`,
        images: imageUrls
      });
    } catch (error) {
      logger.error('uploadRoutes: Processing error', { error: error.message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
});

// Rota para deletar imagem
router.delete('/images/:publicId', authMiddleware, async (req, res) => {
  try {
    const publicId = req.params.publicId;

    // Validações de segurança para publicId
    if (!publicId || typeof publicId !== 'string') {
      logger.warn('uploadRoutes: Invalid publicId for deletion', { publicId });
      return res.status(400).json({ error: 'Public ID inválido' });
    }

    // Verificar se publicId contém apenas caracteres seguros
    const safePublicIdPattern = /^[a-zA-Z0-9\-_\.]+$/;
    if (!safePublicIdPattern.test(publicId)) {
      logger.warn('uploadRoutes: Unsafe publicId for deletion', { publicId });
      return res.status(400).json({ error: 'Public ID contém caracteres inválidos' });
    }

    // Deletar imagem do Cloudinary
    const result = await deleteImage(publicId);

    if (result.result === 'ok') {
      // Log de auditoria para deleção
      logger.info('AUDIT_IMAGE_DELETE', {
        action: 'image_delete',
        userId: req.user?.id,
        userRole: req.user?.role,
        publicId,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      res.json({ success: true, message: 'Imagem deletada com sucesso' });
    } else {
      logger.warn('uploadRoutes: Image not found for deletion', {
        publicId,
        result,
        userId: req.user?.id
      });
      res.status(404).json({ error: 'Imagem não encontrada' });
    }
  } catch (error) {
    logger.error('uploadRoutes: Error deleting image', {
      publicId: req.params.publicId,
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;