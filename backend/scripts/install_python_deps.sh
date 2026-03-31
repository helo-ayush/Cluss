#!/bin/sh
set -e

# Install Python dependencies into a local .venv if Python is available.
# Works on Linux/macOS (Render) and Windows (Git Bash).

PYTHON=""
if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
fi

if [ -z "$PYTHON" ]; then
  echo "No python interpreter found. Skipping Python dependency installation."
  exit 0
fi

# Create virtualenv if missing
if [ ! -d ".venv" ]; then
  echo "Creating virtualenv with $PYTHON"
  $PYTHON -m venv .venv
fi

# Prefer POSIX venv pip
if [ -x ".venv/bin/pip" ]; then
  PIP=".venv/bin/pip"
  PYVENV_PYTHON=".venv/bin/python"
elif [ -x ".venv/Scripts/pip.exe" ]; then
  PIP=".venv/Scripts/pip.exe"
  PYVENV_PYTHON=".venv/Scripts/python.exe"
else
  PIP=""
  PYVENV_PYTHON=""
fi

if [ -n "$PIP" ]; then
  echo "Installing Python packages with $PIP"
  "$PIP" install --upgrade pip || true
  "$PIP" install -r requirements.txt || $PYVENV_PYTHON -m pip install -r requirements.txt || exit 0
else
  echo "pip not found inside .venv; falling back to system python pip"
  $PYTHON -m pip install --upgrade pip || true
  $PYTHON -m pip install -r requirements.txt || exit 0
fi

echo "Python dependencies installed (if Python was available)."
