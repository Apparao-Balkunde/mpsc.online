# Step 1: Build Stage
FROM node:18-alpine AS builder
WORKDIR /app

# १. फक्त package फाईल्स कॉपी करा
COPY package*.json ./

# २. Clean Install करा (विसंगती टाळण्यासाठी npm ci वापरा)
RUN npm ci

# ३. सर्व कोड कॉपी करा
COPY . .

# ४. Vite बिल्ड तयार करा
RUN npm run build

# Step 2: Runtime Stage
FROM node:18-alpine
WORKDIR /app

# ५. प्रोडक्शनसाठी फक्त आवश्यक फाईल्स कॉपी करा
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./

# ६. प्रोडक्शनला लागणाऱ्या मोजक्याच dependencies इंस्टॉल करा (Node_modules पूर्ण कॉपी करू नका)
RUN npm install --omit=dev

# Express सर्वरसाठी पोर्ट
EXPOSE 3000

# सर्वर सुरू करणे
CMD ["node", "server.js"]
