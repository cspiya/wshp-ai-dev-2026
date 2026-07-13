@echo off
title Scoop + workshop-csomagok telepito
echo.
echo =============================================
echo    Scoop es a workshop-csomagok telepitese
echo    Ez eltarthat par percig - kerlek varj!
echo =============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "if (([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrator')) { Write-Host 'FIGYELEM: ne futtasd rendszergazdakent! Zard be es inditsd ujra dupla kattintassal.' -ForegroundColor Red; exit 2 }; if (-not (Get-Command scoop -ErrorAction SilentlyContinue)) { try { Set-ExecutionPolicy Bypass -Scope Process -Force -ErrorAction SilentlyContinue; Invoke-RestMethod -Uri 'https://get.scoop.sh' | Invoke-Expression } catch { Write-Host ('Hiba a Scoop telepitesekor: ' + $_.Exception.Message) -ForegroundColor Red; exit 2 } } else { Write-Host 'A Scoop mar telepitve van, ugrunk a csomagokra.' -ForegroundColor Green }; $env:Path = $env:USERPROFILE + '\scoop\shims;' + $env:Path; $pkgs = 'git','7zip','gh','nodejs-lts','claude-code','codex'; $failed = @(); foreach ($p in $pkgs) { Write-Host ''; $installedPath = Join-Path $env:USERPROFILE ('scoop\apps\' + $p + '\current'); if (Test-Path -LiteralPath $installedPath) { Write-Host ('=== Frissites: ' + $p + ' ===') -ForegroundColor Cyan; scoop update $p } else { Write-Host ('=== Telepites: ' + $p + ' ===') -ForegroundColor Cyan; scoop install $p }; if ($LASTEXITCODE -ne 0) { $failed += $p } }; $shims = $env:USERPROFILE + '\scoop\shims'; $userPath = [Environment]::GetEnvironmentVariable('Path','User'); if (-not $userPath) { $userPath = '' }; if (($userPath -split ';' | Where-Object { $_ }) -notcontains $shims) { [Environment]::SetEnvironmentVariable('Path', (($userPath.TrimEnd(';') + ';' + $shims).TrimStart(';')), 'User'); Write-Host ''; Write-Host ('A Scoop shims mappa bekerult a felhasznaloi PATH-ba: ' + $shims) -ForegroundColor Green } else { Write-Host ''; Write-Host 'A Scoop shims mappa mar szerepel a felhasznaloi PATH-ban.' -ForegroundColor Green }; Write-Host ''; Write-Host 'Ellenorzes:' -ForegroundColor Cyan; foreach ($c in 'git','gh','node','npm','claude','codex') { $found = Get-Command $c -ErrorAction SilentlyContinue; if ($found) { Write-Host ('  OK   ' + $c) -ForegroundColor Green } else { Write-Host ('  HIBA ' + $c + ' nem talalhato') -ForegroundColor Red; $failed += $c } }; if ($failed.Count -gt 0) { Write-Host ''; Write-Host ('BLOKKOLT: ellenorizd ezeket: ' + (($failed | Select-Object -Unique) -join ', ')) -ForegroundColor Red; exit 2 }; Write-Host ''; Write-Host 'KESZ! A Claude Code es a Codex is telepitve es frissitve van.' -ForegroundColor Green; exit 0"

if errorlevel 1 (
  echo.
  echo BLOKKOLT. A fenti hibakat javitsd, majd futtasd ujra ezt a fajlt.
  pause
  exit /b 2
)

echo.
echo =============================================
echo    Vege. Nyiss egy UJ parancssort a
echo    parancsok (git, gh, node, claude, codex)
echo    hasznalatahoz.
echo =============================================
echo.
pause
