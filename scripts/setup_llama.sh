#!/bin/bash
# Setup script for llama.cpp
# This script clones llama.cpp, builds it, and downloads a model

set -e

# Configuration
LLAMA_CPP_REPO="https://github.com/ggerganov/llama.cpp.git"
LLAMA_CPP_DIR="../models/llama.cpp"
MODELS_DIR="../models"
MODEL_URL="https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf"
MODEL_FILENAME="mistral-7b-instruct-v0.2.Q4_K_M.gguf"

# Create directories
mkdir -p "$MODELS_DIR"
cd "$(dirname "$0")"

echo "Setting up llama.cpp..."

# Check if llama.cpp is already cloned
if [ -d "$LLAMA_CPP_DIR" ]; then
  echo "llama.cpp repository already exists. Updating..."
  cd "$LLAMA_CPP_DIR"
  git pull
else
  echo "Cloning llama.cpp repository..."
  git clone "$LLAMA_CPP_REPO" "$LLAMA_CPP_DIR"
  cd "$LLAMA_CPP_DIR"
fi

# Build llama.cpp
echo "Building llama.cpp..."
mkdir -p build
cd build
cmake .. -DLLAMA_CUBLAS=OFF -DLLAMA_BLAS=ON -DCMAKE_BUILD_TYPE=Release
cmake --build . --config Release -j

# Check if build was successful
if [ ! -f "./bin/server" ]; then
  echo "Error: llama.cpp server build failed!"
  exit 1
fi

echo "llama.cpp server built successfully."

# Download model if it doesn't exist
cd "../../"
if [ -f "$MODEL_FILENAME" ]; then
  echo "Model $MODEL_FILENAME already exists."
else
  echo "Downloading model $MODEL_FILENAME..."
  wget -O "$MODEL_FILENAME" "$MODEL_URL"
  
  # Verify download
  if [ ! -f "$MODEL_FILENAME" ]; then
    echo "Error: Model download failed!"
    exit 1
  fi
  
  echo "Model downloaded successfully."
fi

echo "Setup complete!"
echo "To start the server, run: cd $LLAMA_CPP_DIR/build && ./bin/server -m ../../../$MODEL_FILENAME -c 2048 --host 0.0.0.0 --port 8080"
