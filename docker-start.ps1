# ================================
# Pałka MTM - Docker Stack Starter
# ================================
# PowerShell script do zarządzania Docker stack'iem

param(
    [Parameter(Position=0)]
    [ValidateSet('start', 'stop', 'restart', 'logs', 'status', 'cleanup', 'reset')]
    [string]$Command = 'start',
    
    [Parameter(Position=1)]
    [string]$Service = 'all'
)

# Kolory
$Colors = @{
    Green  = "`e[32m"
    Red    = "`e[31m"
    Yellow = "`e[33m"
    Blue   = "`e[34m"
    Reset  = "`e[0m"
}

function Print-Header {
    param([string]$Text)
    Write-Host "$($Colors.Blue)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$($Colors.Reset)"
    Write-Host "$($Colors.Blue)$Text$($Colors.Reset)"
    Write-Host "$($Colors.Blue)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$($Colors.Reset)"
}

function Print-Success {
    param([string]$Text)
    Write-Host "$($Colors.Green)✓ $Text$($Colors.Reset)"
}

function Print-Error {
    param([string]$Text)
    Write-Host "$($Colors.Red)✗ $Text$($Colors.Reset)"
}

function Print-Info {
    param([string]$Text)
    Write-Host "$($Colors.Yellow)ℹ $Text$($Colors.Reset)"
}

function Check-Docker {
    try {
        $null = docker --version
        Print-Success "Docker is installed"
    } catch {
        Print-Error "Docker is not installed or not in PATH"
        exit 1
    }
}

function Check-EnvFile {
    if (-not (Test-Path '.env.local')) {
        Print-Error ".env.local not found!"
        Print-Info "Creating .env.local from .env.docker.example..."
        
        if (Test-Path '.env.docker.example') {
            Copy-Item '.env.docker.example' '.env.local'
            Print-Success ".env.local created from template"
            Print-Info "Please edit .env.local with your Firebase credentials"
        } else {
            Print-Error ".env.docker.example not found!"
            exit 1
        }
    }
}

function Start-Stack {
    Print-Header "🚀 Starting Docker Stack"
    
    Check-Docker
    Check-EnvFile
    
    Print-Info "Starting services..."
    docker-compose -f docker-compose.dev-alt.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Docker stack started successfully!"
        Print-Info "Waiting for services to be healthy (30-60 seconds)..."
        
        Start-Sleep -Seconds 5
        Show-Status
        
        Print-Header "📋 Access Points"
        Write-Host "App              → $($Colors.Green)http://localhost:3001$($Colors.Reset)"
        Write-Host "Grafana          → $($Colors.Green)http://localhost:4000$($Colors.Reset) (admin / admin123)"
        Write-Host "pgAdmin          → $($Colors.Green)http://localhost:5050$($Colors.Reset) (admin@palka-mtm.local / admin123)"
        Write-Host "Mailhog          → $($Colors.Green)http://localhost:8025$($Colors.Reset)"
        Write-Host "MinIO Console    → $($Colors.Green)http://localhost:9001$($Colors.Reset) (minioadmin / minioadmin123)"
        Write-Host "Prometheus       → $($Colors.Green)http://localhost:9090$($Colors.Reset)"
        Write-Host "Redis Commander → $($Colors.Green)http://localhost:8081$($Colors.Reset)"
        Write-Host "Adminer          → $($Colors.Green)http://localhost:8082$($Colors.Reset)"
    } else {
        Print-Error "Failed to start Docker stack"
        exit 1
    }
}

function Stop-Stack {
    Print-Header "🛑 Stopping Docker Stack"
    
    if ($Service -eq 'all') {
        docker-compose -f docker-compose.dev-alt.yml stop
        Print-Success "All services stopped"
    } else {
        docker-compose -f docker-compose.dev-alt.yml stop $Service
        Print-Success "Service '$Service' stopped"
    }
}

function Restart-Stack {
    Print-Header "🔄 Restarting Docker Stack"
    
    if ($Service -eq 'all') {
        docker-compose -f docker-compose.dev-alt.yml restart
        Print-Success "All services restarted"
    } else {
        docker-compose -f docker-compose.dev-alt.yml restart $Service
        Print-Success "Service '$Service' restarted"
    }
}

function Show-Logs {
    Print-Header "📺 Docker Logs"
    
    if ($Service -eq 'all') {
        docker-compose -f docker-compose.dev-alt.yml logs -f --tail=100
    } else {
        docker-compose -f docker-compose.dev-alt.yml logs -f --tail=100 $Service
    }
}

function Show-Status {
    Print-Header "📊 Docker Stack Status"
    
    docker-compose -f docker-compose.dev-alt.yml ps
}

function Cleanup-Stack {
    Print-Header "🧹 Cleaning Up Docker Stack"
    
    Print-Info "Stopping all services..."
    docker-compose -f docker-compose.dev-alt.yml down
    
    Print-Info "Removing unused images and volumes..."
    docker image prune -f
    docker volume prune -f
    
    Print-Success "Cleanup completed"
}

function Reset-Stack {
    Print-Header "⚠️  Resetting Docker Stack (WARNING: This will delete all data!)"
    
    $confirmation = Read-Host "Are you sure? Type 'yes' to confirm"
    
    if ($confirmation -eq 'yes') {
        Print-Info "Stopping all services and removing volumes..."
        docker-compose -f docker-compose.dev-alt.yml down -v --remove-orphans
        
        Print-Success "Stack reset completed"
        Print-Info "Run 'docker-start.ps1 start' to start fresh stack"
    } else {
        Print-Info "Reset cancelled"
    }
}

# Main execution
switch ($Command) {
    'start' { Start-Stack }
    'stop' { Stop-Stack }
    'restart' { Restart-Stack }
    'logs' { Show-Logs }
    'status' { Show-Status }
    'cleanup' { Cleanup-Stack }
    'reset' { Reset-Stack }
    default { Print-Error "Unknown command: $Command" }
}

