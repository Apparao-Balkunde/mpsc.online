import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 'dist' फोल्डर सर्व्ह करणे (हा फोल्डर npm run build नंतर तयार होतो)
app.use(express.static(path.join(__dirname, 'dist')));

// सर्व विनंत्या index.html कडे वळवणे (React Routing साठी)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
