FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create dist folder with a simple index.html for API-only mode
RUN mkdir -p dist && echo '<!DOCTYPE html><html><head><title>LawHelper API</title></head><body><h1>LawHelper API Server</h1><p>API is running. Use /api/health to check status.</p></body></html>' > dist/index.html

# Expose port
EXPOSE 3000

# Start the server
CMD ["npx", "tsx", "server.ts"]
