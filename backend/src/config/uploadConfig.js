import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from './cloudinary.js';

// Configuração do armazenamento no Cloudinary
const storage = new CloudinaryStorage({
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