#!/bin/bash
# run: ./this_script.sh

echo "this script was invoked by run-script"

echo "this script was invoked by run-script"<#
    close_ports_and_processes.ps1

    Opis (PL): Skrypt zamyka procesy nasłuchujące na podanych portach i/lub zamyka procesy po nazwie.
    Parametry:
      -Ports <int[]>         : lista portów do zamknięcia (np. -Ports 3000,9229)
      -ProcessNames <string[]> : lista nazw procesów do zamknięcia (np. -ProcessNames node,chrome)
      -Block                 : jeśli ustawione, dodaje regułę zapory blokującą dany port (wymaga uruchomienia jako Administrator)
      -Force                 : wymusza zabicie procesów bez potwierdzenia
      -WhatIf                : pokazuje co by się stało (suchy przebieg)

    Przykłady:
      .\close_ports_and_processes.ps1 -Ports 3000,9229 -Block -Force
      .\close_ports_and_processes.ps1 -ProcessNames node,chrome -Force
      .\close_ports_and_processes.ps1 -Ports 3000 -WhatIf
#>

[CmdletBinding(SupportsShouldProcess=$true)]
param(
    [int[]] $Ports,
    [switch] $WhatIf

    <#
function Get-PidsByPort {
    param([int] $Port)
    $pids = @()
    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        try {
            $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
            if ($conns) { $pids += $conns | Select-Object -ExpandProperty OwningProcess -Unique }
        } catch { }
    }

    if (-not $pids) {
        # Fallback: netstat
        $lines = netstat -ano -p tcp 2>$null | Select-String ":$Port " -SimpleMatch
        foreach ($l in $lines) {
            $parts = ($l -split '\s+') | Where-Object { $_ -ne '' }
            $pid = $parts[-1]
            if ($pid -match '^[0-9]+$') { $pids += [int]$pid }
        }
    }
    return $pids | Select-Object -Unique
}

function Confirm-And-KillPid {
    param([int] $Pid)
    $proc = Get-Process -Id $Pid -ErrorAction SilentlyContinue
    if (-not $proc) { Write-Host "Proces PID $Pid nie istnieje lub nie można go odczytać."; return }
    $name = $proc.ProcessName
    if ($Force) {
        if ($PSCmdlet.ShouldProcess("PID $Pid", "Zabić proces $name (PID $Pid)")) {
            Stop-Process -Id $Pid -Force -ErrorAction SilentlyContinue
            Write-Host "Zabito proces $name (PID $Pid)."
        }
    } else {
        $ans = Read-Host "Zamknąć proces $name (PID $Pid)? [y/N]"
        if ($ans -match '^[yY]') {
            Stop-Process -Id $Pid -ErrorAction SilentlyContinue
            Write-Host "Zabito proces $name (PID $Pid)."
        } else {
            Write-Host "Pominięto PID $Pid."
        }
    }
}

function Block-PortFirewall {
    param([int] $Port)
    if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Warning "Aby dodać regułę zapory musisz uruchomić PowerShell jako Administrator. Pomijam blokowanie portu $Port."
        return
    }
    $ruleName = "Block-Port-$Port-Script"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Reguła zapory już istnieje dla portu $Port: $ruleName"
        return
    }
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $Port -Protocol TCP -Action Block -Enabled True | Out-Null
    Write-Host "Dodano regułę zapory blokującą port $Port (Inbound)."
}

# --- Wykonanie dla portów ---
if ($Ports) {
    foreach ($p in $Ports) {
        Write-Host "Sprawdzam port $p..."
        $pids = Get-PidsByPort -Port $p
        if (-not $pids) { Write-Host "Brak procesów nasłuchujących na porcie $p."; continue }
        foreach ($pid in $pids) {
            if ($WhatIf) { Write-Host "[WhatIf] Byłoby zabite PID $pid nasłuchujące na porcie $p"; continue }
            Confirm-And-KillPid -Pid $pid
        }
        if ($Block) { Block-PortFirewall -Port $p }
    }
}

# --- Wykonanie dla nazw procesów ---
if ($ProcessNames) {
    foreach ($n in $ProcessNames) {
        $procs = Get-Process -Name $n -ErrorAction SilentlyContinue
        if (-not $procs) { Write-Host "Brak uruchomionych procesów o nazwie '$n'."; continue }
        foreach ($proc in $procs) {
            if ($WhatIf) { Write-Host "[WhatIf] Byłoby zabite $($proc.ProcessName) (PID $($proc.Id))"; continue }
            if ($Force) {
                if ($PSCmdlet.ShouldProcess($proc.Id, "Zabić proces $($proc.ProcessName) (PID $($proc.Id))")) {
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                    Write-Host "Zabito $($proc.ProcessName) (PID $($proc.Id))."
                }
            } else {
                $ans = Read-Host "Zamknąć proces $($proc.ProcessName) (PID $($proc.Id))? [y/N]"
                if ($ans -match '^[yY]') {
                    Stop-Process -Id $proc.Id -ErrorAction SilentlyContinue
                    Write-Host "Zabito $($proc.ProcessName) (PID $($proc.Id))."
                } else { Write-Host "Pominięto $($proc.ProcessName) (PID $($proc.Id))." }
            }
        }
    }
}

Write-Host "Gotowe."
