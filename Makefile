# Dependency Management Makefile
.PHONY: deps-check deps-install deps-verify deps-auto deps-setup help

# Check for missing dependencies (no installation)
deps-check:
	@echo "🔍 Checking for missing dependencies..."
	@node scripts/dependency-manager.js --check

# Install missing dependencies automatically  
deps-install:
	@echo "📦 Installing missing dependencies..."
	@node scripts/dependency-manager.js --install

# Verify integrity of package files
deps-verify:
	@echo "🔐 Verifying dependency integrity..."
	@node scripts/dependency-manager.js --verify

# Auto-detect and install missing dependencies
deps-auto:
	@echo "🚀 Auto-detecting and installing dependencies..."
	@node scripts/dependency-manager.js

# Setup git hooks for automatic dependency management
deps-setup:
	@echo "⚙️ Setting up git hooks for dependency management..."
	@node scripts/install-hooks.js

# Show help
help:
	@echo "🔧 Dependency Management Commands:"
	@echo ""
	@echo "  make deps-check     Check for missing dependencies (no installation)"
	@echo "  make deps-install   Install missing dependencies automatically"  
	@echo "  make deps-verify    Verify integrity of package files"
	@echo "  make deps-auto      Auto-detect and install missing dependencies"
	@echo "  make deps-setup     Setup git hooks for automatic dependency management"
	@echo "  make help           Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make deps-auto      # Most common - check and auto-install"
	@echo "  make deps-check     # Only check what's missing"
	@echo "  make deps-install   # Force install missing deps"