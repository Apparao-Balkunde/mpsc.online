import express from 'express';
import path from 'express'; // किंवा path डायरेक्ट इम्पोर्ट करा
import { fileURLToPath } from 'url';
import compression from 'compression'; // साईट फास्ट लोड होण्यासाठी

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// १. Compression वापरणे (ज्यामुळे तुमची वेबसाईट ५०% जास्त वेगाने लोड होईल)
app.use(compression());

// २. 'dist' फोल्डर सर्व्ह करणे
// 'immutable' कॅशिंग वापरून परफॉर्मन्स वाढवणे
app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1d',
    etag: true
}));

// ३. सेक्युरिटी हेडर (ऐच्छिक पण महत्त्वाचे)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// ४. सर्व विनंत्या index.html कडे वळवणे (React SPA Routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ५. सर्व्हर सुरू करणे
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`🚀 MPSC Sarathi Portal is Live!`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📂 Serving from: ${path.join(__dirname, 'dist')}`);
    console.log(`-------------------------------------------`);
});
