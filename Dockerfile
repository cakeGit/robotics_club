# Use the official Node.js image as the base image
FROM node:18-slim as build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the project for production
RUN npm run build

# Production stage
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the rest of the application code to the working directory
COPY . .

# Install production dependencies only
RUN npm install --production

# Copy the built files from the build stage
COPY --from=build /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Command to serve the built files and run server-side logic
CMD ["node", "server.js"]