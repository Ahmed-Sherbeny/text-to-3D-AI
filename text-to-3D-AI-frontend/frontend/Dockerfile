FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package.json package-lock.json ./
RUN npm install

# Copy the entire frontend source code
COPY . .

# Expose Vite dev port
EXPOSE 3000

# Start Vite server (bound to 0.0.0.0 so it's accessible outside the container)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
