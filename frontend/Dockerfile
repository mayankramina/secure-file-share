# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy rest of the application
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
