#!/bin/sh
set -e

echo "Installing Python dependencies..."

# Render caches sometimes break local virtual environments (.venv).
# It is much safer to install dependencies directly using the system's pip.

if command -v pip3 >/dev/null 2>&1; then
  echo "Found pip3, installing requirements..."
  pip3 install -r requirements.txt || pip3 install --user -r requirements.txt
elif command -v pip >/dev/null 2>&1; then
  echo "Found pip, installing requirements..."
  pip install -r requirements.txt || pip install --user -r requirements.txt
elif command -v python3 >/dev/null 2>&1; then
  echo "Found python3, using module installer..."
  python3 -m pip install -r requirements.txt || python3 -m pip install --user -r requirements.txt
elif command -v python >/dev/null 2>&1; then
  echo "Found python, using module installer..."
  python -m pip install -r requirements.txt || python -m pip install --user -r requirements.txt
else
  echo "Error: Python/Pip not found. Cannot install dependencies."
  exit 0
fi

echo "Python dependencies installed successfully."
