# Check if fnm is installed
if (!(Get-Command fnm -ErrorAction SilentlyContinue)) {
    Write-Host "fnm not found. Installing..."
    try {
        winget install Schniz.fnm --silent --accept-package-agreements --accept-source-agreements
        Write-Host "fnm installed successfully. Please restart VS Code or reload your terminal."
        # Try to add fnm to current session PATH
        $fnmPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Schniz.fnm_Microsoft.Winget.Source_8wekyb3d8bbwe"
        if (Test-Path $fnmPath) {
            $env:PATH += ";$fnmPath"
        }
    }
    catch {
        Write-Error "Failed to install fnm. Please install manually: https://github.com/Schniz/fnm"
        exit 1
    }
}

# Use the Node version from .nvmrc
Write-Host "Setting Node version from .nvmrc..."
fnm use

# Install npm packages
Write-Host "Installing npm packages..."
npm install