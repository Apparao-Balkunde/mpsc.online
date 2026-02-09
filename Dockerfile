# Step 1: Build Stage
FROM node:18-alpine AS builder
WORKDIR /app

# १. बिल्ड आर्गुमेंट्स (हे रेंडरवरून व्हॅल्यूज घेतील)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# २. या आर्गुमेंट्सना एन्व्हायरनमेंट व्हेरिएबल्समध्ये रूपांतरित करा (Vite साठी आवश्यक)
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm install --no-audit --progress=false

COPY . .

# ३. आता Vite ला बिल्ड करताना वरील कीज मिळतील
RUN npm run build

# Step 2: Runtime Stage
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./

RUN npm install --omit=dev --no-audit

EXPOSE 3000

CMD ["node", "server.js"]
