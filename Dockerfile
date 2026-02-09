# Step 1: Build Stage
FROM node:18-alpine AS builder
WORKDIR /app

# १. फक्त package फाईल्स कॉपी करा
COPY package*.json ./

# २. npm install वापरा (पण स्वच्छ पद्धतीने)
RUN npm install --no-audit --progress=false

# ३. सर्व कोड कॉपी करा
COPY . .

# ४. Vite बिल्ड तयार करा
RUN npm run build

# Step 2: Runtime Stage
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./

# ५. फक्त उत्पादन (production) साठी लागणाऱ्या फाईल्स इन्स्टॉल करा
RUN npm install --omit=dev --no-audit

EXPOSE 3000

CMD ["node", "server.js"]
