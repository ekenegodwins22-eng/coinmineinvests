#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

class DependencyManager {
  constructor() {
    this.lockfilePath = join(rootDir, 'dependency-lock.json');
    this.workspaces = [
      { name: 'backend', path: join(rootDir, 'backend') },
      { name: 'frontend', path: join(rootDir, 'frontend') },
      { name: 'root', path: rootDir }
    ];
  }

  // Check if a package is installed
  isPackageInstalled(packageName, workspacePath) {
    const nodeModulesPath = join(workspacePath, 'node_modules', packageName);
    return existsSync(nodeModulesPath);
  }

  // Get package.json dependencies
  getPackageJsonDependencies(workspacePath) {
    const packageJsonPath = join(workspacePath, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      return { dependencies: {}, devDependencies: {}, optionalDependencies: {} };
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      optionalDependencies: packageJson.optionalDependencies || {}
    };
  }

  // Check for missing dependencies in a workspace
  checkMissingDependencies(workspace) {
    console.log(`🔍 Checking dependencies for ${workspace.name}...`);
    
    const { dependencies, devDependencies, optionalDependencies } = 
      this.getPackageJsonDependencies(workspace.path);

    const missing = {
      dependencies: [],
      devDependencies: [],
      optionalDependencies: []
    };

    // Check regular dependencies
    for (const [pkg, version] of Object.entries(dependencies)) {
      if (!this.isPackageInstalled(pkg, workspace.path)) {
        missing.dependencies.push({ name: pkg, version });
      }
    }

    // Check dev dependencies
    for (const [pkg, version] of Object.entries(devDependencies)) {
      if (!this.isPackageInstalled(pkg, workspace.path)) {
        missing.devDependencies.push({ name: pkg, version });
      }
    }

    // Check optional dependencies
    for (const [pkg, version] of Object.entries(optionalDependencies)) {
      if (!this.isPackageInstalled(pkg, workspace.path)) {
        missing.optionalDependencies.push({ name: pkg, version });
      }
    }

    return missing;
  }

  // Install missing dependencies
  installMissingDependencies(workspace, missing) {
    process.chdir(workspace.path);

    let installed = false;

    // Install regular dependencies
    if (missing.dependencies.length > 0) {
      console.log(`📦 Installing ${missing.dependencies.length} dependencies in ${workspace.name}...`);
      const packages = missing.dependencies.map(dep => `${dep.name}@${dep.version}`);
      try {
        execSync(`npm install ${packages.join(' ')}`, { stdio: 'pipe' });
        console.log(`✅ Installed dependencies: ${packages.join(', ')}`);
        installed = true;
      } catch (error) {
        console.error(`❌ Failed to install dependencies in ${workspace.name}:`, error.message);
      }
    }

    // Install dev dependencies
    if (missing.devDependencies.length > 0) {
      console.log(`📦 Installing ${missing.devDependencies.length} dev dependencies in ${workspace.name}...`);
      const packages = missing.devDependencies.map(dep => `${dep.name}@${dep.version}`);
      try {
        execSync(`npm install --save-dev ${packages.join(' ')}`, { stdio: 'pipe' });
        console.log(`✅ Installed dev dependencies: ${packages.join(', ')}`);
        installed = true;
      } catch (error) {
        console.error(`❌ Failed to install dev dependencies in ${workspace.name}:`, error.message);
      }
    }

    // Install optional dependencies
    if (missing.optionalDependencies.length > 0) {
      console.log(`📦 Installing ${missing.optionalDependencies.length} optional dependencies in ${workspace.name}...`);
      const packages = missing.optionalDependencies.map(dep => `${dep.name}@${dep.version}`);
      try {
        execSync(`npm install --save-optional ${packages.join(' ')}`, { stdio: 'pipe' });
        console.log(`✅ Installed optional dependencies: ${packages.join(', ')}`);
        installed = true;
      } catch (error) {
        console.warn(`⚠️ Failed to install optional dependencies in ${workspace.name}:`, error.message);
      }
    }

    return installed;
  }

  // Create/update lockfile with current state
  updateLockfile() {
    const lockData = {
      generated: new Date().toISOString(),
      workspaces: {}
    };

    for (const workspace of this.workspaces) {
      const deps = this.getPackageJsonDependencies(workspace.path);
      const allDeps = { ...deps.dependencies, ...deps.devDependencies, ...deps.optionalDependencies };
      
      lockData.workspaces[workspace.name] = {
        dependencies: Object.keys(allDeps).reduce((acc, pkg) => {
          acc[pkg] = {
            version: allDeps[pkg],
            installed: this.isPackageInstalled(pkg, workspace.path)
          };
          return acc;
        }, {})
      };
    }

    writeFileSync(this.lockfilePath, JSON.stringify(lockData, null, 2));
    console.log(`📄 Updated lockfile: ${this.lockfilePath}`);
  }

  // Detect dependency drift (differences between package.json and what's installed)
  detectDrift() {
    console.log('🔄 Detecting dependency drift...\n');
    
    let totalMissing = 0;
    let installationNeeded = false;

    for (const workspace of this.workspaces) {
      const missing = this.checkMissingDependencies(workspace);
      const missingCount = missing.dependencies.length + 
                          missing.devDependencies.length + 
                          missing.optionalDependencies.length;

      if (missingCount > 0) {
        console.log(`❌ ${workspace.name}: ${missingCount} missing dependencies`);
        totalMissing += missingCount;
        installationNeeded = true;

        // Show what's missing
        if (missing.dependencies.length > 0) {
          console.log(`  Dependencies: ${missing.dependencies.map(d => d.name).join(', ')}`);
        }
        if (missing.devDependencies.length > 0) {
          console.log(`  Dev Dependencies: ${missing.devDependencies.map(d => d.name).join(', ')}`);
        }
        if (missing.optionalDependencies.length > 0) {
          console.log(`  Optional Dependencies: ${missing.optionalDependencies.map(d => d.name).join(', ')}`);
        }
      } else {
        console.log(`✅ ${workspace.name}: All dependencies satisfied`);
      }
    }

    console.log(`\n📊 Total missing dependencies: ${totalMissing}`);
    return { totalMissing, installationNeeded };
  }

  // Auto-install all missing dependencies
  autoInstall() {
    console.log('🚀 Starting automatic dependency installation...\n');

    let installed = false;

    for (const workspace of this.workspaces) {
      const missing = this.checkMissingDependencies(workspace);
      const missingCount = missing.dependencies.length + 
                          missing.devDependencies.length + 
                          missing.optionalDependencies.length;

      if (missingCount > 0) {
        const wasInstalled = this.installMissingDependencies(workspace, missing);
        if (wasInstalled) installed = true;
      }
    }

    if (installed) {
      this.updateLockfile();
      console.log('\n✅ Automatic installation completed!');
    } else {
      console.log('\n✅ No installation needed - all dependencies are satisfied!');
    }

    return installed;
  }

  // Verify integrity of installations
  verifyIntegrity() {
    console.log('🔐 Verifying dependency integrity...\n');

    for (const workspace of this.workspaces) {
      const packageJsonPath = join(workspace.path, 'package.json');
      const packageLockPath = join(workspace.path, 'package-lock.json');

      if (existsSync(packageJsonPath)) {
        console.log(`📄 ${workspace.name}: package.json exists`);
        
        if (existsSync(packageLockPath)) {
          console.log(`🔒 ${workspace.name}: package-lock.json exists`);
        } else {
          console.log(`⚠️ ${workspace.name}: package-lock.json missing - run npm install to generate`);
        }

        // Check if node_modules exists
        const nodeModulesPath = join(workspace.path, 'node_modules');
        if (existsSync(nodeModulesPath)) {
          console.log(`📁 ${workspace.name}: node_modules exists`);
        } else {
          console.log(`❌ ${workspace.name}: node_modules missing - dependencies need installation`);
        }
      }
    }
  }

  // Run full check and auto-fix
  run(options = {}) {
    console.log('🔧 Dependency Manager - Auto Detection & Installation\n');
    
    if (options.verify) {
      this.verifyIntegrity();
      return;
    }

    if (options.check) {
      const result = this.detectDrift();
      if (result.installationNeeded) {
        console.log('\n💡 Run with --install to automatically fix missing dependencies');
      }
      return result;
    }

    if (options.install || options.autoInstall) {
      return this.autoInstall();
    }

    // Default: check and auto-install if needed
    const { installationNeeded } = this.detectDrift();
    
    if (installationNeeded) {
      console.log('\n🤔 Missing dependencies detected. Installing automatically...\n');
      this.autoInstall();
    } else {
      this.updateLockfile();
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const options = {
  check: args.includes('--check') || args.includes('-c'),
  install: args.includes('--install') || args.includes('-i'),
  autoInstall: args.includes('--auto-install') || args.includes('-a'),
  verify: args.includes('--verify') || args.includes('-v')
};

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔧 Dependency Manager - Auto Detection & Installation

Usage:
  node scripts/dependency-manager.js [options]

Options:
  --check, -c          Check for missing dependencies (no installation)
  --install, -i        Install missing dependencies automatically  
  --auto-install, -a   Same as --install
  --verify, -v         Verify integrity of package files
  --help, -h           Show this help message

Examples:
  node scripts/dependency-manager.js                    # Check and auto-install
  node scripts/dependency-manager.js --check           # Only check, don't install
  node scripts/dependency-manager.js --install         # Force install missing deps
  node scripts/dependency-manager.js --verify          # Verify file integrity
`);
  process.exit(0);
}

// Run the dependency manager
const manager = new DependencyManager();
manager.run(options);