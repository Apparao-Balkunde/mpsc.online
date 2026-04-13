# Step 1: Build Stage
FROM node:20-slim AS builder
WORKDIR /app

# १. सिस्टम लायब्ररीज इन्स्टॉल करा
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# २. बिल्ड आर्गुमेंट्स
ARG VITE_SUPABASE_URL=https://vswtorhncwprbxlzewar.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzd3RvcmhuY3dwcmJ4bHpld2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzI2NDUsImV4cCI6MjA4NTk0ODY0NX0.0V9-6ZX6dZ7bYQ_P8DYJkuFmYaCEQQ-01l3yc2s3s2w
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# ३. डिपेंडेंसीज इंस्टॉल करा
COPY package*.json ./
RUN rm -f package-lock.json && npm install --no-audit

# ४. ARM64 साठी बायनरीज आणि PostCSS प्लगइन सक्तीने इन्स्टॉल करा
RUN npm install @tailwindcss/postcss autoprefixer
RUN npm install -f @rollup/rollup-linux-arm64-gnu @swc/core-linux-arm64-gnu

# ५. सर्व कोड कॉपी करा
COPY . .

# ६. बिल्ड करण्यापूर्वी कॅश साफ करा
RUN rm -rf node_modules/.cache
RUN npm run build

# Step 2: Runtime Stage
FROM node:20-slim
WORKDIR /app

# ७. आवश्यक फाईल्स घ्या
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./

# ८. प्रॉडक्शन डिपेंडेंसीज
RUN npm install --omit=dev --no-audit
RUN npm install redis @supabase/supabase-js compression cors dotenv

# ९. पोर्ट ३०००
EXPOSE 3000

# १०. सर्व्हर सुरू करा
CMD ["node", "server.js"]
