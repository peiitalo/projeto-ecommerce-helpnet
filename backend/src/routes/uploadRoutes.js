// backend/src/routes/uploadRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/products';
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${extension}`);
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limite
  },
  fileFilter: fileFilter
});

// Rota para upload de múltiplas imagens
router.post('/images', authMiddleware, (req, res) => {
  // Usar multer como middleware
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      console.error('Erro no upload:', err);

      // Tratar erro de arquivo muito grande
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Arquivo muito grande. O tamanho máximo permitido é 5MB por imagem.'
        });
      }

      // Outros erros do multer
      return res.status(400).json({
        error: err.message || 'Erro no processamento do arquivo'
      });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
      }

      // Retornar URLs das imagens salvas
      const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);

      res.json({
        success: true,
        message: `${req.files.length} imagem(ns) enviada(s) com sucesso`,
        images: imageUrls
      });
    } catch (error) {
      console.error('Erro no processamento do upload:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
});

// Rota para deletar imagem
router.delete('/images/:filename', authMiddleware, (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join('uploads/products', filename);

    // Verificar se arquivo existe
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ success: true, message: 'Imagem deletada com sucesso' });
    } else {
      res.status(404).json({ error: 'Imagem não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;