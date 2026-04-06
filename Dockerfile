FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Verify dist folder exists
RUN ls -la dist/ || echo "Build failed - no dist folder"

# Expose port
EXPOSE 3000

# Start the server
CMD ["npx", "tsx", "server.ts"]
