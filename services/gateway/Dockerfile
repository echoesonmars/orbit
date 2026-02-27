FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Fix permissions and Build TypeScript
RUN chmod +x node_modules/.bin/tsc && npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
