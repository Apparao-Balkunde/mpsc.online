# Step 1: Build Stage
FROM node:18-alpine AS builder
WORKDIR /app

# १. बिल्ड आर्गुमेंट्स - रेंडरच्या 'Environment Variables' मधून व्हॅल्यूज इथे येतील
ARG VITE_SUPABASE_URL=https://vswtorhncwprbxlzewar.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzd3RvcmhuY3dwcmJ4bHpld2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzI2NDUsImV4cCI6MjA4NTk0ODY0NX0.0V9-6ZX6dZ7bYQ_P8DYJkuFmYaCEQQ-01l3yc2s3s2w
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# ३. डिपेंडेंसीज इंस्टॉल करा
COPY package*.json ./
RUN npm install --no-audit --progress=false

# ४. सर्व कोड कॉपी करून बिल्ड तयार करा
COPY . .
RUN npm run build

# Step 2: Runtime Stage (लाईटवेट इमेजसाठी)
FROM node:18-alpine
WORKDIR /app

# ५. बिल्ड स्टेजमधून फक्त आवश्यक फाईल्स घ्या
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./

# ६. प्रॉडक्शनसाठी लागणाऱ्या मोजक्याच लायब्ररीज इंस्टॉल करा
RUN npm install --omit=dev --no-audit

# ७. रेंडरसाठी पोर्ट ३००० एक्स्पोज करा
EXPOSE 3000

# ८. सर्व्हर सुरू करा
CMD ["node", "server.js"]
