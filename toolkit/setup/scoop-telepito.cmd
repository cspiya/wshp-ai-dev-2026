@echo off
title Scoop + workshop-csomagok telepito
echo.
echo =============================================
echo    Scoop es a workshop-csomagok telepitese
echo    Ez eltarthat par percig - kerlek varj!
echo =============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "if (([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrator')) { Write-Host 'FIGYELEM: ne futtasd rendszergazdakent! Zard be es inditsd ujra dupla kattintassal.' -ForegroundColor Red; exit }; if (-not (Get-Command scoop -ErrorAction SilentlyContinue)) { try { Set-ExecutionPolicy Bypass -Scope Process -Force -ErrorAction SilentlyContinue; Invoke-RestMethod -Uri 'https://get.scoop.sh' | Invoke-Expression } catch { Write-Host ('Hiba a Scoop telepitesekor: ' + $_.Exception.Message) -ForegroundColor Red; exit } } else { Write-Host 'A Scoop mar telepitve van, ugrunk a csomagokra.' -ForegroundColor Green }; $env:Path = $env:USERPROFILE + '\scoop\shims;' + $env:Path; $pkgs = 'git','7zip','gh','nodejs-lts','claude-code'; foreach ($p in $pkgs) { Write-Host ''; Write-Host ('=== Telepites: ' + $p + ' ===') -ForegroundColor Cyan; scoop install $p }; $shims = $env:USERPROFILE + '\scoop\shims'; $userPath = [Environment]::GetEnvironmentVariable('Path','User'); if (-not $userPath) { $userPath = '' }; if (($userPath -split ';' | Where-Object { $_ }) -notcontains $shims) { [Environment]::SetEnvironmentVariable('Path', (($userPath.TrimEnd(';') + ';' + $shims).TrimStart(';')), 'User'); Write-Host ''; Write-Host ('A scoop shims mappa bekerult a felhasznaloi PATH-ba: ' + $shims) -ForegroundColor Green } else { Write-Host ''; Write-Host 'A scoop shims mappa mar szerepel a felhasznaloi PATH-ban.' -ForegroundColor Green }; Write-Host ''; Write-Host 'Ellenorzes:' -ForegroundColor Cyan; foreach ($c in 'git','gh','node','claude') { $found = Get-Command $c -ErrorAction SilentlyContinue; if ($found) { Write-Host ('  OK   ' + $c) -ForegroundColor Green } else { Write-Host ('  HIBA ' + $c + ' nem talalhato') -ForegroundColor Red } }; Write-Host ''; Write-Host 'KESZ! Minden csomag feldolgozva.' -ForegroundColor Green"

echo.
echo =============================================
echo    Vege. Nyiss egy UJ parancssort a
echo    parancsok (git, gh, node, claude)
echo    hasznalatahoz.
echo =============================================
echo.
pause
