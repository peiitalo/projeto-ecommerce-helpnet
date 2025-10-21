import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from './cloudinary.js';
import path from 'path';
import fs from 'fs';

// Verificar se o Cloudinary está configurado
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                              process.env.CLOUDINARY_API_KEY && 
                              process.env.CLOUDINARY_API_SECRET &&
                              process.env.CLOUDINARY_CLOUD_NAME !== 'demo';

let storage;

if (isCloudinaryConfigured) {
  // Configuração do armazenamento no Cloudinary
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'products', // Pasta no Cloudinary
      allowed_formats: ['jpg', 'png', 'webp'], // Formatos permitidos
      public_id: (req, file) => {
        // Geração de nome único para o arquivo
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `product-${timestamp}-${random}`;
      },
    },
  });
  console.log('✓ Usando Cloudinary para armazenamento de imagens');
} else {
  // Configuração do armazenamento local como fallback
  const uploadDir = path.join(process.cwd(), 'uploads', 'products');
  
  // Criar diretório se não existir
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const ext = path.extname(file.originalname);
      cb(null, `product-${timestamp}-${random}${ext}`);
    }
  });
  console.log('⚠️  Usando armazenamento local para imagens (configure Cloudinary para produção)');
}

// Filtro de arquivo para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem (JPEG, PNG, WebP) são permitidos!'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB por arquivo
  },
  fileFilter: fileFilter,
});

export default upload;