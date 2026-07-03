# Cierra Metro/Expo que esté escuchando en el puerto 8081 (u otro con ELIGR_METRO_PORT).
$metroPort = if ($env:ELIGR_METRO_PORT) { [int]$env:ELIGR_METRO_PORT } else { 8081 }

function Get-ListeningPids([int]$Port) {
  try {
    return @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique)
  } catch {
    $pids = @()
    netstat -ano | Select-String ":$Port\s" | ForEach-Object {
      if ($_ -match "\s+(\d+)\s*$") { $pids += [int]$Matches[1] }
    }
    return @($pids | Select-Object -Unique)
  }
}

function Stop-NodeProcess([int]$ProcId) {
  $proc = Get-Process -Id $ProcId -ErrorAction SilentlyContinue
  if (-not $proc -or $proc.Name -notmatch "^node$") {
    return $false
  }

  try {
    Stop-Process -Id $ProcId -Force -ErrorAction Stop
    return $true
  } catch {
    $taskkill = Get-Command taskkill -ErrorAction SilentlyContinue
    if ($taskkill) {
      & taskkill /PID $ProcId /F 2>&1 | Out-Null
      Start-Sleep -Milliseconds 400
      return -not (Get-Process -Id $ProcId -ErrorAction SilentlyContinue)
    }
    return $false
  }
}

$stopped = $false
$failed = @()

foreach ($procId in Get-ListeningPids $metroPort) {
  if (Stop-NodeProcess $procId) {
    Write-Host "Detenido node (PID $procId) en puerto $metroPort"
    $stopped = $true
  } else {
    $failed += $procId
  }
}

if ($failed.Count -gt 0) {
  Write-Host "No pude cerrar node en PID $($failed -join ', '). Cierra esa terminal con Ctrl+C o ejecuta: taskkill /PID $($failed[0]) /F" -ForegroundColor Yellow
}

if (-not $stopped -and $failed.Count -eq 0) {
  Write-Host "Nada que detener en puerto $metroPort"
}
