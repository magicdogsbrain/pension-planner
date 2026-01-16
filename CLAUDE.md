# CLAUDE.md - Pension Tool

## Project Overview
A macOS desktop application for pension drawdown analysis using Monte Carlo simulations. Built with Electron.js and vanilla JavaScript as a single-page application.

## Quick Reference

### Commands
```bash
npm start          # Run in development mode
npm run build      # Build production DMG for macOS
```

### Tech Stack
- **Runtime**: Electron 28.0.0
- **UI**: Vanilla JavaScript + HTML5 + CSS3 (no framework)
- **Build**: electron-builder 24.9.1
- **Platform**: macOS (ARM64 + Intel)

## Project Structure
```
pension-app/
├── main.js         # Electron main process, window config
├── index.html      # Complete SPA (HTML + CSS + JS embedded)
├── package.json    # Dependencies and build config
└── dist/           # Build output (DMG files)
```

## Architecture

### Single-File Application
All application logic is in `index.html` (~1,600 lines):
- Embedded CSS with CSS custom properties for theming
- Embedded JavaScript with global-scope functions
- No build step or bundling required

### Two Main Modules
1. **Decision Tool** - Monthly pension drawdown tracking with PACW/CGT/CSH2 calculations
2. **Stress Tester** - Monte Carlo simulation (1,000 runs) with historical analysis

### Key Functions
| Function | Purpose |
|----------|---------|
| `simulate()` | Main pension drawdown simulation engine |
| `runMonteCarlo()` | Multi-run stress testing (1000 iterations) |
| `calcSIPPDraw()` | SIPP withdrawal calculations |
| `calcGlidepath()` | Minimum asset glidepath computation |
| `cgtReturn()` | Capital gains tax calculations |

### Data Storage
- Uses `localStorage` for persistence
- Keys: `pension_decision_v53`, `pension_stress_v53`
- Location: `~/Library/Application Support/pension-tool/Local Storage/`

### Historical Data
Embedded historical data (1928-2024) for:
- Equity returns
- Inflation rates

## Coding Conventions

### Style
- Global-scope functions (no modules/classes)
- Direct DOM manipulation
- Immediate-mode UI rendering
- Dark theme with CSS variables (--bg, --fg, --accent, etc.)

### Visualization
- Canvas-based custom charts (no charting library)
- Cone of uncertainty plots
- Trajectory visualization with hover tooltips

## Security
- `nodeIntegration: false`
- `contextIsolation: true`
- Offline-first (no external API calls)

## Version
Current: 5.3.0
