# 1. Base image
FROM node:20-alpine
# 2. Working directory
WORKDIR /app
# 3. Copy package.json / package-lock.json
COPY package*.json ./
# 4. Install only production dependencies
RUN npm install --production
# 5. Copy the rest of the code
COPY . .
# 6. Open port (inside the container)
EXPOSE 5000
# 7. Environment variables can be overridden when running the container
ENV PORT=5000
ENV NODE_ENV=production
# 8. Command to run
CMD ["npm", "start"]