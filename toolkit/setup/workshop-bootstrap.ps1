[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Destination,

    [ValidateSet('Auto', 'Claude', 'Codex', 'Both')]
    [string]$Agent = 'Auto',

    [switch]$IncludeLegacy,

    [string]$ReplayPath,

    [switch]$InstallDependencies,

    [ValidateSet('Pending', 'Connected', 'Manual')]
    [string]$BrowserMode = 'Pending',

    [switch]$AgentConfirmed,

    [string]$EvidencePath,

    [string]$ProbeFixture
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$source = [IO.Path]::GetFullPath((Join-Path $repoRoot 'participant-starter'))
$doctor = Join-Path $PSScriptRoot 'workshop-doctor.ps1'
$destinationFull = [IO.Path]::GetFullPath($Destination)

if (-not (Test-Path -LiteralPath $source -PathType Container)) {
    Write-Error "Participant starter not found: $source"
    exit 2
}

if ([string]::IsNullOrWhiteSpace($EvidencePath)) {
    $EvidencePath = Join-Path (Split-Path $destinationFull -Parent) 'workshop-evidence'
}
$evidenceFull = [IO.Path]::GetFullPath($EvidencePath)

function Test-PathOverlap {
    param([string]$First, [string]$Second)

    $separator = [IO.Path]::DirectorySeparatorChar
    return $First.Equals($Second, [StringComparison]::OrdinalIgnoreCase) -or
        $First.StartsWith($Second.TrimEnd($separator) + $separator, [StringComparison]::OrdinalIgnoreCase) -or
        $Second.StartsWith($First.TrimEnd($separator) + $separator, [StringComparison]::OrdinalIgnoreCase)
}

if (Test-PathOverlap -First $destinationFull -Second $source) {
    Write-Error 'Destination must not be the participant starter or one of its parent/child directories.'
    exit 2
}
if ($evidenceFull.Equals($destinationFull, [StringComparison]::OrdinalIgnoreCase) -or
    $evidenceFull.StartsWith($destinationFull.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    Write-Error 'EvidencePath must be outside the participant workspace.'
    exit 2
}

function Invoke-Doctor {
    param([string]$Workspace)

    $arguments = @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', $doctor,
        '-Agent', $Agent,
        '-WorkspacePath', $Workspace
    )
    if ($IncludeLegacy) { $arguments += '-IncludeLegacy' }
    if ($ReplayPath) { $arguments += @('-ReplayPath', $ReplayPath) }
    if ($ProbeFixture) { $arguments += @('-ProbeFixture', $ProbeFixture) }

    $hostExecutable = (Get-Process -Id $PID).Path
    $output = & $hostExecutable @arguments 2>&1
    $exitCode = $LASTEXITCODE
    $output | ForEach-Object { Write-Host $_ }
    $statusLine = $output | Where-Object { [string]$_ -like 'DOCTOR_STATUS=*' } | Select-Object -Last 1
    $status = if ($statusLine) { ([string]$statusLine).Split('=', 2)[1] } else { 'BLOCKED' }
    return [pscustomobject]@{ ExitCode = $exitCode; Status = $status }
}

Write-Output 'Running preflight against the participant starter...'
$preflight = Invoke-Doctor -Workspace $source
if ($preflight.ExitCode -ne 0 -or $preflight.Status -eq 'BLOCKED') {
    Write-Error 'Bootstrap stopped because the doctor reported BLOCKED.'
    exit 2
}

$markerName = '.workshop-bootstrap.json'
$markerPath = Join-Path $destinationFull $markerName
$initializedNow = $false
$existingMarker = $null

if (Test-Path -LiteralPath $destinationFull) {
    $existingItems = @(Get-ChildItem -LiteralPath $destinationFull -Force -ErrorAction Stop)
    if ($existingItems.Count -gt 0 -and -not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
        Write-Error "Destination is not empty and is not owned by this bootstrap: $destinationFull"
        exit 2
    }
    if (Test-Path -LiteralPath $markerPath -PathType Leaf) {
        try {
            $existingMarker = Get-Content -LiteralPath $markerPath -Raw -Encoding UTF8 | ConvertFrom-Json
            $validMarker = [int]$existingMarker.schemaVersion -eq 1 -and
                [string]$existingMarker.source -eq 'participant-starter' -and
                -not [string]::IsNullOrWhiteSpace([string]$existingMarker.sourceSha) -and
                [IO.Path]::GetFullPath([string]$existingMarker.destination) -eq $destinationFull
            if (-not $validMarker) { throw 'marker schema or destination identity is invalid' }
        }
        catch {
            Write-Error "Destination marker is invalid; refusing every mutation: $($_.Exception.Message)"
            exit 2
        }
    }
}
else {
    New-Item -ItemType Directory -Path $destinationFull -Force | Out-Null
}

if (-not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
    Write-Output "Creating participant workspace: $destinationFull"
    $trackedFiles = @(& git -C $repoRoot ls-files -- 'participant-starter')
    if ($LASTEXITCODE -ne 0 -or $trackedFiles.Count -eq 0) {
        Write-Error 'Could not enumerate tracked participant-starter files.'
        exit 2
    }
    foreach ($trackedFile in $trackedFiles) {
        $relativePath = ([string]$trackedFile).Substring('participant-starter/'.Length)
        $sourceFile = Join-Path $repoRoot ([string]$trackedFile).Replace('/', [IO.Path]::DirectorySeparatorChar)
        $destinationFile = Join-Path $destinationFull $relativePath.Replace('/', [IO.Path]::DirectorySeparatorChar)
        $destinationDirectory = Split-Path $destinationFile -Parent
        if (-not (Test-Path -LiteralPath $destinationDirectory -PathType Container)) {
            New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
        }
        Copy-Item -LiteralPath $sourceFile -Destination $destinationFile -Force
    }

    $sourceSha = (& git -C $repoRoot rev-parse HEAD 2>$null | Select-Object -First 1)
    [ordered]@{
        schemaVersion = 1
        source = 'participant-starter'
        sourceSha = [string]$sourceSha
        destination = $destinationFull
        createdAt = (Get-Date).ToString('o')
    } | ConvertTo-Json | Set-Content -LiteralPath $markerPath -Encoding UTF8
    $initializedNow = $true
}
else {
    Write-Output "Reusing bootstrap-owned workspace: $destinationFull"
}

if (-not (Test-Path -LiteralPath (Join-Path $destinationFull '.git') -PathType Container)) {
    & git -C $destinationFull init -b main 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error 'git init failed.'
        exit 2
    }
}

$dependencyStatus = 'SKIPPED - run again with -InstallDependencies after reviewing the destination'
$verification = New-Object System.Collections.Generic.List[string]

if ($InstallDependencies) {
    if ($ProbeFixture) {
        $dependencyStatus = 'SIMULATED BY TEST FIXTURE - npm ci PASS'
        $verification.Add('npm run typecheck - PASS (test fixture)')
        $verification.Add('npm run test - PASS (test fixture)')
    }
    else {
        Push-Location $destinationFull
        try {
            if (-not (Test-Path -LiteralPath (Join-Path $destinationFull 'node_modules') -PathType Container)) {
                Write-Output 'Installing dependencies with npm ci...'
                & npm ci
                if ($LASTEXITCODE -ne 0) {
                    Write-Error 'npm ci failed.'
                    exit 2
                }
                $dependencyStatus = 'INSTALLED - npm ci PASS'
            }
            else {
                $dependencyStatus = 'REUSED - node_modules already exists'
            }

            foreach ($command in @('typecheck', 'test')) {
                Write-Output "Running npm run $command..."
                & npm run $command
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "npm run $command failed."
                    exit 2
                }
                $verification.Add("npm run $command - PASS")
            }
        }
        finally {
            Pop-Location
        }
    }
}
else {
    $verification.Add('dependency install and baseline commands - SKIPPED by explicit choice')
}

New-Item -ItemType Directory -Path $evidenceFull -Force | Out-Null
$evidenceFile = Join-Path $evidenceFull 'C0-setup.md'
$marker = Get-Content -LiteralPath $markerPath -Raw -Encoding UTF8 | ConvertFrom-Json
$postflight = Invoke-Doctor -Workspace $destinationFull
if ($postflight.ExitCode -ne 0 -or $postflight.Status -eq 'BLOCKED') {
    Write-Error 'Bootstrap stopped because the post-bootstrap doctor reported BLOCKED.'
    exit 2
}
$executionMode = if ($postflight.Status -eq 'REPLAY') { 'REPLAY' } else { 'LOCAL' }
$c0Status = if ($InstallDependencies -and $AgentConfirmed -and $BrowserMode -ne 'Pending') { $postflight.Status } else { 'PENDING' }

$evidenceLines = @(
    '# C0 - workshop setup evidence',
    '',
    "- Status: $c0Status",
    "- Doctor status: $($postflight.Status)",
    "- Execution mode: $executionMode",
    "- Agent selection: $Agent",
    "- Agent response confirmed: $([bool]$AgentConfirmed)",
    "- Browser mode: $BrowserMode",
    "- Participant workspace: $destinationFull",
    "- Evidence workspace: $evidenceFull",
    "- Starter source SHA: $($marker.sourceSha)",
    "- Bootstrap initialized now: $initializedNow",
    "- Dependencies: $dependencyStatus",
    "- Verified at: $((Get-Date).ToString('o'))",
    '',
    '## Verification',
    ''
)
foreach ($line in $verification) {
    $evidenceLines += "- $line"
}
$evidenceLines += @(
    '',
    '## Human checks still required',
    '',
    '- Complete account sign-in and OAuth only in the official browser flow.',
    '- If C0 is PENDING, rerun with -InstallDependencies, -AgentConfirmed and -BrowserMode Connected or Manual after checking them.',
    '- Never paste or record tokens, passwords, or environment-variable values in this file.'
)
$evidenceLines | Set-Content -LiteralPath $evidenceFile -Encoding UTF8

Write-Output ''
Write-Output "Participant workspace: $destinationFull"
Write-Output "C0 evidence: $evidenceFile"
Write-Output 'BOOTSTRAP_STATUS=PASS'
Write-Output "C0_STATUS=$c0Status"
exit 0
