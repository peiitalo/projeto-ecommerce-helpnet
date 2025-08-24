import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import userRoutes from './routes/userRoutes.js';

dotenv.config();    
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('./routes/userRoutes', userRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta: ${PORT}`);
});