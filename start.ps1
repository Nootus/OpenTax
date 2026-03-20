# OpenTax — Start both servers and open browser

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Start FastAPI backend
Start-Process pwsh -ArgumentList '-NoExit', '-Command', "cd '$root\api'; .\.venv\Scripts\Activate.ps1; python -m uvicorn main:app --reload --port 8000"

# Start Next.js frontend
Start-Process pwsh -ArgumentList '-NoExit', '-Command', "cd '$root\web'; npm run dev"

# Wait for the frontend to be ready, then open browser
Start-Sleep -Seconds 5
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (Test-Path $chromePath) {
    Start-Process $chromePath "http://localhost:3000"
} else {
    Start-Process "http://localhost:3000"
}

# Close this launcher terminal
Stop-Process -Id $PID
