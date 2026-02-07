import express from 'express';
import path from 'node:path'; // 'node:' प्रीफिक्स वापरणे अधिक सुरक्षित आहे
import { fileURLToPath } from 'node:url';
import compression from 'compression';

// ES Modules मध्ये __dirname अशा प्रकारे सेट करावा लागतो
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Gzip Compression (साईट फास्ट लोड होण्यासाठी)
app.use(compression());

// १. सर्वात आधी 'dist' फोल्डर सर्व्ह करणे
// जर 'dist' फोल्डर सर्व्हरवर नसेल तर ही ओळ एरर देऊ शकते
app.use(express.static(path.join(__dirname, 'dist')));

// २. सर्व API रूट्स इथे टाकू शकता (सध्या गरज नाही)

// ३. शेवटी सर्व विनंत्या index.html कडे वळवणे (React Routing साठी)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`-------------------------------------------`);
  console.log(`🚀 MPSC Sarathi Server is running!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`📂 Serving from: ${path.join(__dirname, 'dist')}`);
  console.log(`-------------------------------------------`);
});
