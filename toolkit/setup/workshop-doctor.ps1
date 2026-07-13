[CmdletBinding()]
param(
    [ValidateSet('Auto', 'Claude', 'Codex', 'Both')]
    [string]$Agent = 'Auto',

    [string]$WorkspacePath,

    [switch]$IncludeLegacy,

    [string]$ReplayPath,

    [string]$ProbeFixture
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if ([string]::IsNullOrWhiteSpace($WorkspacePath)) {
    $WorkspacePath = Join-Path $repoRoot 'participant-starter'
}

$fixture = $null
if ($ProbeFixture) {
    if (-not (Test-Path -LiteralPath $ProbeFixture -PathType Leaf)) {
        Write-Error "Probe fixture not found: $ProbeFixture"
        exit 2
    }
    $fixture = Get-Content -LiteralPath $ProbeFixture -Raw -Encoding UTF8 | ConvertFrom-Json
}

$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
    param(
        [string]$Name,
        [ValidateSet('PASS', 'BLOCKED', 'REPLAY', 'OPTIONAL')]
        [string]$Status,
        [string]$Observed,
        [string]$Remediation = ''
    )

    $results.Add([pscustomobject]@{
        Name = $Name
        Status = $Status
        Observed = $Observed
        Remediation = $Remediation
    })
}

function Get-FixtureCommandProbe {
    param([string]$Name)

    if ($null -eq $fixture -or $null -eq $fixture.commands) {
        return [pscustomobject]@{ Found = $false; ExitCode = $null; Output = '' }
    }
    $property = $fixture.commands.PSObject.Properties[$Name]
    if ($null -eq $property -or $null -eq $property.Value) {
        return [pscustomobject]@{ Found = $false; ExitCode = $null; Output = '' }
    }
    if ($property.Value -is [string]) {
        return [pscustomobject]@{ Found = $true; ExitCode = 0; Output = [string]$property.Value }
    }
    return [pscustomobject]@{
        Found = if ($null -ne $property.Value.PSObject.Properties['found']) { [bool]$property.Value.found } else { $true }
        ExitCode = if ($null -ne $property.Value.PSObject.Properties['exitCode']) { [int]$property.Value.exitCode } else { 0 }
        Output = if ($null -ne $property.Value.PSObject.Properties['output']) { [string]$property.Value.output } else { '' }
    }
}

function Get-CommandProbe {
    param(
        [string]$Name,
        [string[]]$Arguments = @('--version')
    )

    if ($null -ne $fixture) {
        return Get-FixtureCommandProbe -Name $Name
    }

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        return [pscustomobject]@{ Found = $false; ExitCode = $null; Output = '' }
    }

    try {
        $output = @(& $command.Source @Arguments 2>&1)
        $exitCode = $LASTEXITCODE
        $line = $output | Select-Object -First 1
        return [pscustomobject]@{
            Found = $true
            ExitCode = $exitCode
            Output = if ($null -eq $line) { 'version output empty' } else { [string]$line }
        }
    }
    catch {
        return [pscustomobject]@{ Found = $true; ExitCode = 1; Output = "version check failed: $($_.Exception.Message)" }
    }
}

function Test-CommandProbe {
    param([object]$Probe)
    return $Probe.Found -and $Probe.ExitCode -eq 0
}

function Test-ReplayPack {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path -PathType Container)) {
        return $false
    }
    $manifestPath = Join-Path $Path 'replay-manifest.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        return $false
    }
    try {
        $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ([int]$manifest.schemaVersion -ne 1 -or $null -eq $manifest.files) {
            return $false
        }
        foreach ($relativeFile in @($manifest.files)) {
            if ([string]::IsNullOrWhiteSpace([string]$relativeFile) -or
                -not (Test-Path -LiteralPath (Join-Path $Path ([string]$relativeFile)) -PathType Leaf)) {
                return $false
            }
        }
        return @($manifest.files).Count -gt 0
    }
    catch {
        return $false
    }
}

function Test-NodeVersion {
    param([string]$VersionText)

    if ($VersionText -notmatch '(\d+)\.(\d+)') {
        return $false
    }
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    return ($major -gt 22) -or ($major -eq 22 -and $minor -ge 13)
}

function Test-DotnetVersion {
    param([string]$VersionText)

    if ($VersionText -notmatch '(\d+)\.') {
        return $false
    }
    return [int]$Matches[1] -ge 10
}

function Get-Browsers {
    if ($null -ne $fixture) {
        if ($null -eq $fixture.browsers) {
            return @()
        }
        return @($fixture.browsers | ForEach-Object { [string]$_ })
    }

    $candidates = @(
        @{ Name = 'Chrome'; Command = 'chrome'; Paths = @(
            "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
            "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
            "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
        ) },
        @{ Name = 'Edge'; Command = 'msedge'; Paths = @(
            "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
            "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
        ) }
    )

    $found = New-Object System.Collections.Generic.List[string]
    foreach ($candidate in $candidates) {
        if (Get-Command $candidate.Command -ErrorAction SilentlyContinue) {
            $found.Add($candidate.Name)
            continue
        }
        foreach ($path in $candidate.Paths) {
            if ($path -and (Test-Path -LiteralPath $path -PathType Leaf)) {
                $found.Add($candidate.Name)
                break
            }
        }
    }
    return @($found | Select-Object -Unique)
}

function Get-WorkspaceState {
    if ($null -ne $fixture -and $null -ne $fixture.workspace) {
        return [pscustomobject]@{
            Exists = [bool]$fixture.workspace.exists
            PackageJson = [bool]$fixture.workspace.packageJson
            Agents = [bool]$fixture.workspace.agents
        }
    }

    return [pscustomobject]@{
        Exists = Test-Path -LiteralPath $WorkspacePath -PathType Container
        PackageJson = Test-Path -LiteralPath (Join-Path $WorkspacePath 'package.json') -PathType Leaf
        Agents = Test-Path -LiteralPath (Join-Path $WorkspacePath 'AGENTS.md') -PathType Leaf
    }
}

$gitProbe = Get-CommandProbe -Name 'git'
$ghProbe = Get-CommandProbe -Name 'gh'
$nodeProbe = Get-CommandProbe -Name 'node'
$npmProbe = Get-CommandProbe -Name 'npm'
$claudeProbe = Get-CommandProbe -Name 'claude'
$codexProbe = Get-CommandProbe -Name 'codex'

if (Test-CommandProbe $gitProbe) { Add-Result 'git' 'PASS' $gitProbe.Output } else { Add-Result 'git' 'BLOCKED' $(if ($gitProbe.Found) { "version probe failed (exit $($gitProbe.ExitCode)): $($gitProbe.Output)" } else { 'not found' }) 'Install or repair Git, then open a new terminal.' }
if (Test-CommandProbe $ghProbe) { Add-Result 'gh' 'PASS' $ghProbe.Output } else { Add-Result 'gh' 'BLOCKED' $(if ($ghProbe.Found) { "version probe failed (exit $($ghProbe.ExitCode)): $($ghProbe.Output)" } else { 'not found' }) 'Install or repair GitHub CLI, then open a new terminal.' }

if ((Test-CommandProbe $nodeProbe) -and (Test-NodeVersion -VersionText $nodeProbe.Output)) {
    Add-Result 'node' 'PASS' $nodeProbe.Output
}
elseif ($nodeProbe.Found) {
    Add-Result 'node' 'BLOCKED' $nodeProbe.Output 'Install or repair Node.js 22.13 or newer.'
}
else {
    Add-Result 'node' 'BLOCKED' 'not found' 'Install Node.js 22.13 or newer.'
}

if (Test-CommandProbe $npmProbe) { Add-Result 'npm' 'PASS' $npmProbe.Output } else { Add-Result 'npm' 'BLOCKED' $(if ($npmProbe.Found) { "version probe failed (exit $($npmProbe.ExitCode)): $($npmProbe.Output)" } else { 'not found' }) 'Install or repair npm with Node.js.' }

switch ($Agent) {
    'Claude' {
        if (Test-CommandProbe $claudeProbe) { Add-Result 'claude' 'PASS' $claudeProbe.Output } else { Add-Result 'claude' 'BLOCKED' $(if ($claudeProbe.Found) { "version probe failed (exit $($claudeProbe.ExitCode)): $($claudeProbe.Output)" } else { 'not found' }) 'Install or repair Claude Code, or select -Agent Codex.' }
        if (Test-CommandProbe $codexProbe) { Add-Result 'codex' 'OPTIONAL' $codexProbe.Output }
    }
    'Codex' {
        if (Test-CommandProbe $codexProbe) { Add-Result 'codex' 'PASS' $codexProbe.Output } else { Add-Result 'codex' 'BLOCKED' $(if ($codexProbe.Found) { "version probe failed (exit $($codexProbe.ExitCode)): $($codexProbe.Output)" } else { 'not found' }) 'Install or repair Codex, or select -Agent Claude.' }
        if (Test-CommandProbe $claudeProbe) { Add-Result 'claude' 'OPTIONAL' $claudeProbe.Output }
    }
    'Both' {
        if (Test-CommandProbe $claudeProbe) { Add-Result 'claude' 'PASS' $claudeProbe.Output } else { Add-Result 'claude' 'BLOCKED' $(if ($claudeProbe.Found) { "version probe failed (exit $($claudeProbe.ExitCode)): $($claudeProbe.Output)" } else { 'not found' }) 'Install or repair Claude Code.' }
        if (Test-CommandProbe $codexProbe) { Add-Result 'codex' 'PASS' $codexProbe.Output } else { Add-Result 'codex' 'BLOCKED' $(if ($codexProbe.Found) { "version probe failed (exit $($codexProbe.ExitCode)): $($codexProbe.Output)" } else { 'not found' }) 'Install or repair Codex.' }
    }
    default {
        if ((Test-CommandProbe $claudeProbe) -or (Test-CommandProbe $codexProbe)) {
            $available = @()
            if (Test-CommandProbe $claudeProbe) { $available += "Claude: $($claudeProbe.Output)" }
            if (Test-CommandProbe $codexProbe) { $available += "Codex: $($codexProbe.Output)" }
            Add-Result 'ai-agent' 'PASS' ($available -join '; ')
        }
        else {
            Add-Result 'ai-agent' 'BLOCKED' 'neither Claude Code nor Codex found' 'Install at least one supported coding agent.'
        }
    }
}

$browsers = @(Get-Browsers)
if ($browsers.Count -gt 0) {
    Add-Result 'browser-prerequisite' 'PASS' ($browsers -join ', ')
}
else {
    Add-Result 'browser-prerequisite' 'OPTIONAL' 'Chrome/Edge not found' 'Codex @Browser can use its own profile; otherwise install a supported browser or use the documented MANUAL lane.'
}

$workspace = Get-WorkspaceState
if (-not $workspace.Exists) {
    Add-Result 'workspace' 'BLOCKED' "not found: $WorkspacePath" 'Use -WorkspacePath with the participant starter or bootstrap destination.'
}
elseif (-not $workspace.PackageJson -or -not $workspace.Agents) {
    $missing = @()
    if (-not $workspace.PackageJson) { $missing += 'package.json' }
    if (-not $workspace.Agents) { $missing += 'AGENTS.md' }
    Add-Result 'workspace' 'BLOCKED' ("missing: " + ($missing -join ', ')) 'Use the workshop participant starter, not an empty directory.'
}
else {
    Add-Result 'workspace' 'PASS' $WorkspacePath
}

if ($IncludeLegacy) {
    $dotnetProbe = Get-CommandProbe -Name 'dotnet'
    if ((Test-CommandProbe $dotnetProbe) -and (Test-DotnetVersion -VersionText $dotnetProbe.Output)) {
        Add-Result 'dotnet' 'PASS' $dotnetProbe.Output
    }
    elseif (Test-ReplayPack -Path $ReplayPath) {
        Add-Result 'dotnet' 'REPLAY' $(if ($dotnetProbe.Found) { $dotnetProbe.Output } else { 'not found' }) "Using validated replay pack: $ReplayPath"
    }
    else {
        Add-Result 'dotnet' 'BLOCKED' $(if ($dotnetProbe.Found) { $dotnetProbe.Output } else { 'not found' }) 'Install .NET SDK 10, or provide -ReplayPath containing a valid replay-manifest.json and all listed files.'
    }
}

$portAvailable = $true
if ($null -ne $fixture -and $null -ne $fixture.PSObject.Properties['port3000Available']) {
    $portAvailable = [bool]$fixture.port3000Available
}
elseif ($null -eq $fixture) {
    try {
        $listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
        $portAvailable = $null -eq $listener
    }
    catch {
        $portAvailable = $true
    }
}

if ($portAvailable) {
    Add-Result 'port-3000' 'PASS' 'available'
}
else {
    Add-Result 'port-3000' 'OPTIONAL' 'already in use' 'Stop the existing process or accept the next available Next.js port.'
}

Write-Output ''
Write-Output 'Workshop doctor'
Write-Output '==============='
foreach ($result in $results) {
    Write-Output ("[{0}] {1}: {2}" -f $result.Status, $result.Name, $result.Observed)
    if ($result.Remediation) {
        Write-Output ("        -> {0}" -f $result.Remediation)
    }
}

$overall = 'PASS'
if ($results.Status -contains 'BLOCKED') {
    $overall = 'BLOCKED'
}
elseif ($results.Status -contains 'REPLAY') {
    $overall = 'REPLAY'
}

Write-Output ''
Write-Output ("DOCTOR_STATUS={0}" -f $overall)

if ($overall -eq 'BLOCKED') {
    exit 2
}
exit 0
