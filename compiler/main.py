import os
import sys
import uuid
import time
import shutil
import asyncio
import tempfile
import subprocess
from pydantic import BaseModel
from fastapi import FastAPI, Request, HTTPException

# Import resource module for Linux resource limiting
try:
    import resource
except ImportError:
    resource = None

app = FastAPI(title="StudyHelper Code Compiler")

# Global counter to track active requests
active_requests = 0
active_requests_lock = asyncio.Lock()

class CompileRequest(BaseModel):
    code: str
    language: str
    timeout: float = 3.0

def set_subprocess_limits():
    """Sets CPU and memory limits on Linux for the executed subprocess."""
    if resource is not None:
        # Limit address space (virtual memory) to 256MB
        mem_limit = 256 * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_AS, (mem_limit, mem_limit))
        # Limit CPU time to 5 seconds (slightly longer than execution timeout)
        resource.setrlimit(resource.RLIMIT_CPU, (5, 5))
        # Limit number of processes (to prevent fork bombs)
        resource.setrlimit(resource.RLIMIT_NPROC, (50, 50))

@app.middleware("http")
async def track_requests(request: Request, call_next):
    global active_requests
    is_compile = request.url.path == "/compile"
    if is_compile:
        async with active_requests_lock:
            active_requests += 1
    try:
        response = await call_next(request)
        return response
    finally:
        if is_compile:
            async with active_requests_lock:
                active_requests -= 1

@app.get("/")
def read_root():
    return {"status": "Compiler service is running"}

@app.get("/status")
def get_status():
    return {
        "status": "healthy",
        "active_requests": active_requests
    }

@app.post("/compile")
def compile_code(payload: CompileRequest):
    code = payload.code
    lang = payload.language.lower().strip()
    timeout = min(max(payload.timeout, 1.0), 5.0)  # Clamp timeout between 1s and 5s
    
    # Configure language-specific details
    lang_config = {
        "python": {"ext": ".py", "compile": None, "run": [sys.executable, "main.py"]},
        "python3": {"ext": ".py", "compile": None, "run": [sys.executable, "main.py"]},
        "javascript": {"ext": ".js", "compile": None, "run": ["node", "main.js"]},
        "js": {"ext": ".js", "compile": None, "run": ["node", "main.js"]},
        "typescript": {"ext": ".ts", "compile": None, "run": ["ts-node", "main.ts"]},
        "ts": {"ext": ".ts", "compile": None, "run": ["ts-node", "main.ts"]},
        "cpp": {"ext": ".cpp", "compile": ["g++", "-O2", "-o", "exec", "main.cpp"], "run": ["./exec"]},
        "c": {"ext": ".c", "compile": ["gcc", "-O2", "-o", "exec", "main.c"], "run": ["./exec"]},
        "java": {"ext": ".java", "filename": "Main.java", "compile": None, "run": ["java", "Main.java"]},
        "go": {"ext": ".go", "compile": None, "run": ["go", "run", "main.go"]},
        "golang": {"ext": ".go", "compile": None, "run": ["go", "run", "main.go"]},
        "rust": {"ext": ".rs", "compile": ["rustc", "-O", "-o", "exec", "main.rs"], "run": ["./exec"]},
        "rs": {"ext": ".rs", "compile": ["rustc", "-O", "-o", "exec", "main.rs"], "run": ["./exec"]},
        "ruby": {"ext": ".rb", "compile": None, "run": ["ruby", "main.rb"]},
        "php": {"ext": ".php", "compile": None, "run": ["php", "main.php"]}
    }

    if lang not in lang_config:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {payload.language}")

    config = lang_config[lang]
    # Adjust executable path on Windows for compiled languages
    if sys.platform == "win32" and config["run"] == ["./exec"]:
        config["run"] = ["exec.exe"]

    ext = config["ext"]
    filename = config.get("filename", f"main{ext}")

    # Create temporary directory for isolated execution
    temp_dir = tempfile.mkdtemp(prefix="compiler_")
    filepath = os.path.join(temp_dir, filename)

    try:
        # Write user code to file
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)

        # Run compilation if necessary
        if config["compile"]:
            compile_proc = subprocess.run(
                config["compile"],
                cwd=temp_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=10.0  # Max compilation limit 10s
            )
            if compile_proc.returncode != 0:
                return {
                    "stdout": "",
                    "stderr": f"Compilation Error:\n{compile_proc.stderr}",
                    "exit_code": compile_proc.returncode,
                    "execution_time": 0.0
                }

        # Run execution
        start_time = time.perf_counter()
        
        # Determine resource limits flag (only supported on Linux)
        preexec = set_subprocess_limits if (sys.platform != "win32") else None
        
        run_proc = subprocess.run(
            config["run"],
            cwd=temp_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout,
            preexec_fn=preexec
        )
        
        execution_time = time.perf_counter() - start_time

        return {
            "stdout": run_proc.stdout,
            "stderr": run_proc.stderr,
            "exit_code": run_proc.returncode,
            "execution_time": round(execution_time, 4)
        }

    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": f"Error: Time Limit Exceeded ({timeout} seconds)",
            "exit_code": 124,
            "execution_time": timeout
        }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": f"System Execution Error: {str(e)}",
            "exit_code": -1,
            "execution_time": 0.0
        }
    finally:
        # Clean up temporary directory
        shutil.rmtree(temp_dir, ignore_errors=True)
