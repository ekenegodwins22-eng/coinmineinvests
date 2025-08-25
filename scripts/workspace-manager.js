#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

class WorkspaceManager {
  constructor() {
    this.workspaces = [
      { name: 'backend', path: './backend', hasPackageJson: true },
      { name: 'frontend', path: './frontend', hasPackageJson: true },
      { name: 'root', path: '.', hasPackageJson: true }
    ];
  }

  // Install dependencies in all workspaces
  installAll() {
    console.log('📦 Installing dependencies in all workspaces...\n');
    
    for (const workspace of this.workspaces) {
      if (!workspace.hasPackageJson) continue;
      
      const packageJsonPath = join(workspace.path, 'package.json');
      if (!existsSync(packageJsonPath)) {
        console.log(`⚠️ Skipping ${workspace.name}: no package.json found`);
        continue;
      }

      console.log(`🔧 Installing dependencies in ${workspace.name}...`);
      try {
        process.chdir(workspace.path);
        execSync('npm install', { stdio: 'pipe' });
        console.log(`✅ ${workspace.name}: Dependencies installed successfully`);
        
        // Return to root directory
        if (workspace.path !== '.') {
          process.chdir('..');
        }
      } catch (error) {
        console.error(`❌ ${workspace.name}: Failed to install dependencies`);
        console.error(error.message);
      }
    }
  }

  // Clean node_modules in all workspaces
  cleanAll() {
    console.log('🧹 Cleaning node_modules in all workspaces...\n');
    
    for (const workspace of this.workspaces) {
      const nodeModulesPath = join(workspace.path, 'node_modules');
      if (existsSync(nodeModulesPath)) {
        console.log(`🗑️ Removing node_modules in ${workspace.name}...`);
        try {
          execSync(`rm -rf ${nodeModulesPath}`, { stdio: 'pipe' });
          console.log(`✅ ${workspace.name}: node_modules cleaned`);
        } catch (error) {
          console.error(`❌ ${workspace.name}: Failed to clean node_modules`);
        }
      }
    }
  }

  // Update dependencies in all workspaces
  updateAll() {
    console.log('📈 Updating dependencies in all workspaces...\n');
    
    for (const workspace of this.workspaces) {
      if (!workspace.hasPackageJson) continue;
      
      const packageJsonPath = join(workspace.path, 'package.json');
      if (!existsSync(packageJsonPath)) continue;

      console.log(`📈 Updating dependencies in ${workspace.name}...`);
      try {
        process.chdir(workspace.path);
        execSync('npm update', { stdio: 'pipe' });
        console.log(`✅ ${workspace.name}: Dependencies updated successfully`);
        
        if (workspace.path !== '.') {
          process.chdir('..');
        }
      } catch (error) {
        console.error(`❌ ${workspace.name}: Failed to update dependencies`);
      }
    }
  }

  // Check outdated packages
  checkOutdated() {
    console.log('📊 Checking for outdated dependencies...\n');
    
    for (const workspace of this.workspaces) {
      if (!workspace.hasPackageJson) continue;
      
      const packageJsonPath = join(workspace.path, 'package.json');
      if (!existsSync(packageJsonPath)) continue;

      console.log(`📊 Checking outdated packages in ${workspace.name}:`);
      try {
        process.chdir(workspace.path);
        const output = execSync('npm outdated --json', { stdio: 'pipe', encoding: 'utf-8' });
        
        if (output.trim()) {
          const outdated = JSON.parse(output);
          const count = Object.keys(outdated).length;
          console.log(`  Found ${count} outdated packages`);
          
          for (const [pkg, info] of Object.entries(outdated)) {
            console.log(`    ${pkg}: ${info.current} → ${info.latest}`);
          }
        } else {
          console.log(`  ✅ All packages are up to date`);
        }
        
        if (workspace.path !== '.') {
          process.chdir('..');
        }
      } catch (error) {
        // npm outdated returns non-zero exit code when packages are outdated
        if (error.stdout) {
          try {
            const outdated = JSON.parse(error.stdout);
            const count = Object.keys(outdated).length;
            console.log(`  Found ${count} outdated packages`);
            
            for (const [pkg, info] of Object.entries(outdated)) {
              console.log(`    ${pkg}: ${info.current} → ${info.latest}`);
            }
          } catch {
            console.log(`  ✅ All packages appear to be up to date`);
          }
        }
      }
      console.log('');
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

const manager = new WorkspaceManager();

switch (command) {
  case 'install':
    manager.installAll();
    break;
  case 'clean':
    manager.cleanAll();
    break;
  case 'update':
    manager.updateAll();
    break;
  case 'outdated':
    manager.checkOutdated();
    break;
  case 'reset':
    manager.cleanAll();
    console.log('\n🔄 Reinstalling fresh dependencies...\n');
    manager.installAll();
    break;
  default:
    console.log(`
🏗️ Workspace Manager - Multi-package dependency management

Usage:
  node scripts/workspace-manager.js [command]

Commands:
  install   Install dependencies in all workspaces
  clean     Remove node_modules from all workspaces  
  update    Update dependencies in all workspaces
  outdated  Check for outdated packages
  reset     Clean and reinstall all dependencies

Examples:
  node scripts/workspace-manager.js install   # Install all deps
  node scripts/workspace-manager.js clean     # Clean all node_modules
  node scripts/workspace-manager.js reset     # Clean and reinstall
`);
    break;
}