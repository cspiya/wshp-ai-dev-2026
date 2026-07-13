$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$doctor = Join-Path $PSScriptRoot 'workshop-doctor.ps1'
$bootstrap = Join-Path $PSScriptRoot 'workshop-bootstrap.ps1'
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("wshp-setup-test-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempRoot | Out-Null

function Write-Fixture {
    param(
        [string]$Name,
        [hashtable]$Commands,
        [string[]]$Browsers,
        [bool]$PortAvailable = $true
    )

    $path = Join-Path $tempRoot "$Name.json"
    [ordered]@{
        commands = $Commands
        browsers = $Browsers
        workspace = [ordered]@{ exists = $true; packageJson = $true; agents = $true }
        port3000Available = $PortAvailable
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $path -Encoding UTF8
    return $path
}

function Invoke-ScriptProcess {
    param([string]$Script, [string[]]$Arguments)

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & powershell -NoProfile -ExecutionPolicy Bypass -File $Script @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
    return [pscustomobject]@{ ExitCode = $exitCode; Output = @($output | ForEach-Object { [string]$_ }) }
}

try {
    $passFixture = Write-Fixture -Name 'pass' -Commands @{
        git = 'git version 2.50.0'
        gh = 'gh version 2.75.0'
        node = 'v22.13.1'
        npm = '10.9.2'
        claude = '2.1.206'
        codex = 'codex-cli 0.144.1'
        dotnet = '10.0.201'
    } -Browsers @('Chrome', 'Edge')

    $blockedFixture = Write-Fixture -Name 'blocked' -Commands @{
        gh = 'gh version 2.75.0'
        node = 'v20.0.0'
        npm = '10.0.0'
    } -Browsers @()

    $replayFixture = Write-Fixture -Name 'replay' -Commands @{
        git = 'git version 2.50.0'
        gh = 'gh version 2.75.0'
        node = 'v22.13.1'
        npm = '10.9.2'
        codex = 'codex-cli 0.144.1'
    } -Browsers @()

    $failedCommandFixture = Write-Fixture -Name 'failed-command' -Commands @{
        git = 'git version 2.50.0'
        gh = 'gh version 2.75.0'
        node = 'v22.13.1'
        npm = '10.9.2'
        codex = @{ output = 'fake codex failure'; exitCode = 7 }
    } -Browsers @('Chrome')

    $legacyOldFixture = Write-Fixture -Name 'legacy-old' -Commands @{
        git = 'git version 2.50.0'
        gh = 'gh version 2.75.0'
        node = 'v22.13.1'
        npm = '10.9.2'
        codex = 'codex-cli 0.144.1'
        dotnet = '8.0.400'
    } -Browsers @('Chrome')

    $replayPack = Join-Path $tempRoot 'replay-pack'
    New-Item -ItemType Directory -Path $replayPack | Out-Null
    'verified replay evidence' | Set-Content -LiteralPath (Join-Path $replayPack 'legacy-evidence.txt') -Encoding UTF8
    @{ schemaVersion = 1; files = @('legacy-evidence.txt') } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $replayPack 'replay-manifest.json') -Encoding UTF8

    $pass = Invoke-ScriptProcess -Script $doctor -Arguments @('-Agent', 'Both', '-WorkspacePath', 'fixture', '-IncludeLegacy', '-ProbeFixture', $passFixture)
    if ($pass.ExitCode -ne 0 -or $pass.Output -notcontains 'DOCTOR_STATUS=PASS') {
        throw "PASS fixture failed: $($pass.Output -join [Environment]::NewLine)"
    }

    $blocked = Invoke-ScriptProcess -Script $doctor -Arguments @('-Agent', 'Auto', '-WorkspacePath', 'fixture', '-ProbeFixture', $blockedFixture)
    if ($blocked.ExitCode -eq 0 -or $blocked.Output -notcontains 'DOCTOR_STATUS=BLOCKED') {
        throw "BLOCKED fixture failed: $($blocked.Output -join [Environment]::NewLine)"
    }

    $replay = Invoke-ScriptProcess -Script $doctor -Arguments @('-Agent', 'Codex', '-WorkspacePath', 'fixture', '-ReplayPath', $replayPack, '-IncludeLegacy', '-ProbeFixture', $replayFixture)
    if ($replay.ExitCode -ne 0 -or $replay.Output -notcontains 'DOCTOR_STATUS=REPLAY') {
        throw "REPLAY fixture failed: $($replay.Output -join [Environment]::NewLine)"
    }

    $failedCommand = Invoke-ScriptProcess -Script $doctor -Arguments @('-Agent', 'Codex', '-WorkspacePath', 'fixture', '-ProbeFixture', $failedCommandFixture)
    if ($failedCommand.ExitCode -eq 0 -or $failedCommand.Output -notcontains 'DOCTOR_STATUS=BLOCKED' -or $failedCommand.Output -match '\[PASS\] codex') {
        throw "Non-zero version command was not blocked: $($failedCommand.Output -join [Environment]::NewLine)"
    }

    $legacyWithoutReplay = Invoke-ScriptProcess -Script $doctor -Arguments @('-Agent', 'Codex', '-WorkspacePath', 'fixture', '-IncludeLegacy', '-ProbeFixture', $legacyOldFixture)
    if ($legacyWithoutReplay.ExitCode -eq 0 -or $legacyWithoutReplay.Output -notcontains 'DOCTOR_STATUS=BLOCKED') {
        throw "Old .NET without validated replay was not blocked: $($legacyWithoutReplay.Output -join [Environment]::NewLine)"
    }

    $destination = Join-Path $tempRoot 'participant-repo'
    $evidence = Join-Path $tempRoot 'workshop-evidence'
    $bootstrapArgs = @('-Destination', $destination, '-Agent', 'Both', '-EvidencePath', $evidence, '-ProbeFixture', $passFixture, '-InstallDependencies', '-AgentConfirmed', '-BrowserMode', 'Manual')
    $first = Invoke-ScriptProcess -Script $bootstrap -Arguments $bootstrapArgs
    if ($first.ExitCode -ne 0 -or $first.Output -notcontains 'BOOTSTRAP_STATUS=PASS' -or $first.Output -notcontains 'C0_STATUS=PASS') {
        throw "First bootstrap failed: $($first.Output -join [Environment]::NewLine)"
    }

    $marker = Join-Path $destination '.workshop-bootstrap.json'
    $markerBefore = Get-Content -LiteralPath $marker -Raw -Encoding UTF8
    $second = Invoke-ScriptProcess -Script $bootstrap -Arguments $bootstrapArgs
    $markerAfter = Get-Content -LiteralPath $marker -Raw -Encoding UTF8
    if ($second.ExitCode -ne 0 -or $second.Output -notcontains 'BOOTSTRAP_STATUS=PASS' -or $second.Output -notcontains 'C0_STATUS=PASS') {
        throw "Second bootstrap failed: $($second.Output -join [Environment]::NewLine)"
    }
    if ($markerBefore -ne $markerAfter) {
        throw 'Bootstrap marker changed on the idempotent second run.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $destination 'package.json') -PathType Leaf)) {
        throw 'Bootstrap did not copy package.json.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $evidence 'C0-setup.md') -PathType Leaf)) {
        throw 'Bootstrap did not create C0 evidence.'
    }
    foreach ($ignoredArtifact in @('tsconfig.tsbuildinfo', 'next-env.d.ts', '.env.local')) {
        if (Test-Path -LiteralPath (Join-Path $destination $ignoredArtifact)) {
            throw "Bootstrap copied ignored/untracked file: $ignoredArtifact"
        }
    }

    $pendingDestination = Join-Path $tempRoot 'pending-workspace'
    $pending = Invoke-ScriptProcess -Script $bootstrap -Arguments @('-Destination', $pendingDestination, '-Agent', 'Both', '-ProbeFixture', $passFixture)
    if ($pending.ExitCode -ne 0 -or $pending.Output -notcontains 'BOOTSTRAP_STATUS=PASS' -or $pending.Output -notcontains 'C0_STATUS=PENDING') {
        throw "No-install bootstrap claimed a completed C0: $($pending.Output -join [Environment]::NewLine)"
    }

    $unowned = Join-Path $tempRoot 'unowned-workspace'
    New-Item -ItemType Directory -Path $unowned | Out-Null
    $sentinel = Join-Path $unowned 'keep-me.txt'
    'do not overwrite' | Set-Content -LiteralPath $sentinel -Encoding UTF8
    $refused = Invoke-ScriptProcess -Script $bootstrap -Arguments @('-Destination', $unowned, '-Agent', 'Both', '-ProbeFixture', $passFixture)
    if ($refused.ExitCode -eq 0 -or (Get-Content -LiteralPath $sentinel -Raw -Encoding UTF8).Trim() -ne 'do not overwrite') {
        throw 'Bootstrap did not safely refuse an unowned non-empty destination.'
    }

    $corrupt = Join-Path $tempRoot 'corrupt-marker-workspace'
    New-Item -ItemType Directory -Path $corrupt | Out-Null
    $corruptSentinel = Join-Path $corrupt 'keep-me.txt'
    'do not mutate' | Set-Content -LiteralPath $corruptSentinel -Encoding UTF8
    '{}' | Set-Content -LiteralPath (Join-Path $corrupt '.workshop-bootstrap.json') -Encoding UTF8
    $corruptResult = Invoke-ScriptProcess -Script $bootstrap -Arguments @('-Destination', $corrupt, '-Agent', 'Both', '-ProbeFixture', $passFixture)
    if ($corruptResult.ExitCode -eq 0 -or
        (Test-Path -LiteralPath (Join-Path $corrupt '.git')) -or
        (Get-Content -LiteralPath $corruptSentinel -Raw -Encoding UTF8).Trim() -ne 'do not mutate') {
        throw 'Bootstrap mutated a workspace with a corrupt ownership marker.'
    }

    Write-Output 'workshop setup tests: PASS'
}
finally {
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}
