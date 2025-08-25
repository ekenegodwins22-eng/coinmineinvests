# 🔧 Automatic Dependency Detection & Installation System

A comprehensive dependency management system that automatically detects, validates, and installs missing dependencies across your multi-workspace project, similar to lockfile functionality.

## 🚀 Quick Start

### Option 1: Using the Shell Script (Recommended)
```bash
./deps.sh                    # Auto-detect and install missing dependencies
./deps.sh check             # Only check what's missing (no installation)
./deps.sh install           # Force install missing dependencies
./deps.sh setup             # Setup git hooks for automation
```

### Option 2: Using Make Commands
```bash
make deps-auto              # Auto-detect and install missing dependencies
make deps-check             # Only check what's missing
make deps-install           # Force install missing dependencies
make deps-setup             # Setup git hooks
```

### Option 3: Direct Node.js Execution  
```bash
node scripts/dependency-manager.js --check      # Check only
node scripts/dependency-manager.js --install    # Install missing
node scripts/dependency-manager.js --verify     # Verify integrity
```

## 🏗️ Features

### ✅ **Automatic Detection**
- Scans `backend/`, `frontend/`, and root directories
- Compares package.json with installed node_modules
- Detects missing dependencies, devDependencies, and optionalDependencies
- Reports exactly what's missing and where

### ✅ **Smart Installation**
- Automatically installs only missing dependencies
- Preserves existing installations
- Handles different dependency types correctly
- Works across multiple workspaces simultaneously

### ✅ **Lockfile-Style Management**
- Creates `dependency-lock.json` tracking current state
- Timestamps and tracks installation history
- Validates dependency integrity across workspaces
- Prevents dependency drift

### ✅ **Git Integration**
- Sets up automatic git hooks for dependency checking
- Pre-commit: Validates dependencies before commits
- Post-merge: Auto-installs after pull/merge operations  
- Post-checkout: Auto-installs after branch switching

### ✅ **Multi-Workspace Support**
- **Backend**: Express.js API dependencies
- **Frontend**: React/Vite UI dependencies
- **Root**: Shared tooling and build dependencies

## 📊 Example Output

```bash
$ ./deps.sh check

🔧 Dependency Manager - Auto Detection & Installation

🔄 Detecting dependency drift...

🔍 Checking dependencies for backend...
❌ backend: 37 missing dependencies
  Dependencies: @types/express, express, drizzle-orm, postgres, ...
  
🔍 Checking dependencies for frontend...  
❌ frontend: 63 missing dependencies
  Dependencies: react, @radix-ui/react-dialog, framer-motion, ...
  
🔍 Checking dependencies for root...
✅ root: All dependencies satisfied

📊 Total missing dependencies: 100

💡 Run with --install to automatically fix missing dependencies
```

## ⚙️ Configuration

The system automatically detects these workspace configurations:

```javascript
workspaces: [
  { name: 'backend', path: './backend' },    // API server dependencies
  { name: 'frontend', path: './frontend' },  // React app dependencies  
  { name: 'root', path: '.' }                // Build tools & shared deps
]
```

## 🔄 Git Hooks Automation

After running `./deps.sh setup`, the system automatically:

1. **Pre-commit**: Checks dependencies before every commit
2. **Post-merge**: Installs new dependencies after pull/merge
3. **Post-checkout**: Installs dependencies after branch switching

This ensures your team never has missing dependencies after git operations.

## 📄 Lockfile Management

The system creates `dependency-lock.json` tracking:

```json
{
  "generated": "2025-08-25T21:14:00.000Z",
  "workspaces": {
    "backend": {
      "dependencies": {
        "express": { "version": "^4.21.2", "installed": true },
        "drizzle-orm": { "version": "^0.44.4", "installed": true }
      }
    },
    "frontend": {
      "dependencies": {
        "react": { "version": "^18.3.1", "installed": true }
      }
    }
  }
}
```

## 🛠️ Advanced Usage

### Workspace Management
```bash
node scripts/workspace-manager.js install    # Install all workspace deps
node scripts/workspace-manager.js clean      # Clean all node_modules
node scripts/workspace-manager.js update     # Update all dependencies
node scripts/workspace-manager.js outdated   # Check for outdated packages
node scripts/workspace-manager.js reset      # Clean and reinstall
```

### Integration with CI/CD
```yaml
# GitHub Actions example
- name: Check Dependencies
  run: ./deps.sh check
  
- name: Install Missing Dependencies  
  run: ./deps.sh install
```

## 🔍 How It Works

1. **Detection**: Reads package.json files across workspaces
2. **Validation**: Checks if packages exist in node_modules
3. **Installation**: Uses npm install with correct dependency types
4. **Tracking**: Updates lockfile with current installation state
5. **Verification**: Validates integrity and completeness

## 🚨 Error Handling

The system gracefully handles:
- Missing package.json files
- Network failures during installation
- Permission issues
- Optional dependency failures (warns but continues)
- Corrupted node_modules directories

## 🎯 Benefits

### For Development
- ✅ Never worry about missing dependencies
- ✅ Automatic setup for new team members  
- ✅ Consistent environment across workspaces
- ✅ Fast detection of dependency issues

### For Deployment
- ✅ Verified dependencies before builds
- ✅ Consistent lockfile tracking
- ✅ Automated CI/CD integration
- ✅ Reduced deployment failures

### For Teams
- ✅ Git hooks prevent broken commits
- ✅ Automatic post-merge dependency sync
- ✅ Clear visibility into what's missing
- ✅ No manual dependency management

## 🔧 Troubleshooting

### Common Issues

**"Module not found" errors**:
```bash
./deps.sh install  # Auto-install missing dependencies
```

**Git hooks not working**:
```bash
./deps.sh setup    # Reinstall git hooks
```

**Lockfile out of sync**:
```bash
node scripts/dependency-manager.js  # Regenerate lockfile
```

**Clean install needed**:
```bash
node scripts/workspace-manager.js reset  # Clean and reinstall all
```

## 📈 Performance

- **Detection**: ~2-5 seconds across all workspaces
- **Installation**: Variable based on missing dependencies
- **Verification**: ~1-2 seconds for integrity checks
- **Lockfile Update**: < 1 second

The system is optimized for speed and only installs what's actually missing, making it much faster than full `npm install` runs.

---

**🎉 Result**: Your project now has automatic dependency detection and installation, ensuring consistent environments and eliminating "works on my machine" issues!