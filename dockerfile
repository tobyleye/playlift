# Start with the official Golang base image
FROM golang:1.22.3-alpine

# Set the current working directory inside the container
WORKDIR /app

# Copy the go.mod and go.sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source code into the container
COPY . .

# Install Air for live reloading
RUN go install github.com/cosmtrek/air@latest

# Command to run Air for live reloading
CMD ["air"]
