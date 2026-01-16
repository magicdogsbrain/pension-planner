# Pension Planner (Electron)

A macOS desktop application for pension drawdown planning with Monte Carlo stress testing.

## Features

- **Decision Tool**: Monthly pension drawdown tracking with PACW/CGT/CSH2 fund calculations
- **Stress Tester**: Monte Carlo simulation (1,000 runs), historical sequence analysis, and stress scenarios
- **Tax-Efficient**: Optimizes SIPP withdrawals to stay within basic rate tax band
- **Glidepath Strategy**: Inflation-adjusted fund minimums with depletion curves
- **Protection Mode**: Automatic defensive posture during consecutive CSH2 draws
- **HODL Reserve**: Break-glass reserve fund for severe market downturns
- **Auto-Backup**: Automatic backup to Documents folder on exit

## Requirements

- macOS (ARM64 or Intel)
- Node.js 18+

## Quick Start

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

Creates a DMG installer in the `dist/` folder.

## Files

- `main.js` - Electron main process (window, menus, IPC)
- `index.html` - Complete single-page application
- `preload.js` - IPC bridge for file operations
- `package.json` - Dependencies and build config

## Data Storage

- **Primary**: Electron localStorage at `~/Library/Application Support/pension-planner/`
- **Backup**: `~/Documents/PensionPlannerBackups/`

## Signing (Optional)

For distribution to others, you'd need to sign with an Apple Developer certificate. For personal use, run unsigned - right-click → Open the first time.

## License

MIT
