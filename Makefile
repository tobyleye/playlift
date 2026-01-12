.PHONY: dev server worker client install-deps stop clean help

# Start all services (server, worker, and client)
dev:
	@echo "Starting all services..."
	@make -j3 server worker client

# Run the Go server with air (hot reload)
server:
	@echo "Starting server on port 8080..."
	@air .

# Run the worker for background tasks
worker:
	@echo "Starting worker..."
	@go run worker/worker.go

# Run the React client
client:
	@echo "Starting client on port 3500..."
	@cd web && npm run dev

# Install all dependencies
install-deps:
	@echo "Installing Go dependencies..."
	@go mod download
	@echo "Installing web dependencies..."
	@cd web && npm install
	@echo "Installing air if not present..."
	@which air > /dev/null || go install github.com/air-verse/air@latest

# Stop all running processes
stop:
	@echo "Stopping all services..."
	@pkill -f "air" || true
	@pkill -f "worker.go" || true
	@pkill -f "vite" || true

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf tmp/
	@cd web && rm -rf dist/ node_modules/.vite
	@go clean

# Show help
help:
	@echo "Available commands:"
	@echo "  make dev          - Start server, worker, and client concurrently"
	@echo "  make server       - Start only the Go server"
	@echo "  make worker       - Start only the worker"
	@echo "  make client       - Start only the React client"
	@echo "  make install-deps - Install all dependencies"
	@echo "  make stop         - Stop all running services"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make help         - Show this help message"
