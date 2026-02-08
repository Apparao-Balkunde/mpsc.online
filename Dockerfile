# Step 1: Build Stage
FROM node:18-alpine AS builder
WORKDIR /app

# Dependencies इन्स्टॉल करणे
COPY package*.json ./
RUN npm install

# सर्व कोड कॉपी करणे आणि Vite बिल्ड तयार करणे
COPY . .
RUN npm run build

# Step 2: Runtime Stage
FROM node:18-alpine
WORKDIR /app

# फक्त आवश्यक फाईल्स कॉपी करणे
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/node_modules ./node_modules

# Express सर्वरसाठी पोर्ट एक्स्पोज करणे
EXPOSE 3000

# सर्वर सुरू करणे
CMD ["npm", "start"]
