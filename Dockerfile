# Use Bun official image
FROM oven/bun:latest

# Set timezone
ENV TZ=Asia/Bangkok

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose port if needed (adjust based on your application)
# EXPOSE 3000

# Run the application
CMD ["bun", "run", "start"]

