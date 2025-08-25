#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Install git hooks for automatic dependency management
const setupGitHooks = () => {
  const gitHooksDir = '.git/hooks';
  
  if (!existsSync(gitHooksDir)) {
    console.log('❌ Git repository not found. Initialize git first: git init');
    return;
  }

  // Pre-commit hook to check dependencies
  const preCommitHook = `#!/bin/sh
echo "🔍 Checking dependencies before commit..."
node scripts/dependency-manager.js --check
if [ $? -ne 0 ]; then
  echo "❌ Dependency check failed. Fix dependencies before committing."
  exit 1
fi
`;

  // Post-merge hook to auto-install dependencies after pull/merge
  const postMergeHook = `#!/bin/sh
echo "📦 Checking for new dependencies after merge..."
node scripts/dependency-manager.js --auto-install
`;

  // Post-checkout hook for branch switching
  const postCheckoutHook = `#!/bin/sh
echo "🔄 Checking dependencies after checkout..."
node scripts/dependency-manager.js --auto-install
`;

  try {
    execSync(`echo '${preCommitHook}' > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`);
    execSync(`echo '${postMergeHook}' > .git/hooks/post-merge && chmod +x .git/hooks/post-merge`);
    execSync(`echo '${postCheckoutHook}' > .git/hooks/post-checkout && chmod +x .git/hooks/post-checkout`);
    
    console.log('✅ Git hooks installed successfully!');
    console.log('  - pre-commit: Check dependencies before commits');
    console.log('  - post-merge: Auto-install after pull/merge');
    console.log('  - post-checkout: Auto-install after branch switch');
  } catch (error) {
    console.error('❌ Failed to install git hooks:', error.message);
  }
};

setupGitHooks();