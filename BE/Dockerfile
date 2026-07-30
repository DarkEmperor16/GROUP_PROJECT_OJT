# Use Node.js 20 Alpine base image (MongoDB driver >= 6.x requires Node >= 20 to avoid crypto errors)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency management files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 3000

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Command to start application
CMD ["npm", "start"]
