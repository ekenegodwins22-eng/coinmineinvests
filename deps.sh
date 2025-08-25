#!/bin/bash

# Dependency Management Script
# Usage: ./deps.sh [command]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANAGER_SCRIPT="$SCRIPT_DIR/scripts/dependency-manager.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if dependency manager exists
if [ ! -f "$MANAGER_SCRIPT" ]; then
    echo -e "${RED}❌ Dependency manager script not found at: $MANAGER_SCRIPT${NC}"
    exit 1
fi

# Function to show help
show_help() {
    echo -e "${BLUE}🔧 Dependency Management Tool${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check      Check for missing dependencies (no installation)"
    echo "  install    Install missing dependencies automatically"
    echo "  verify     Verify integrity of package files"
    echo "  auto       Auto-detect and install missing dependencies (default)"
    echo "  setup      Setup git hooks for automatic dependency management"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0          # Auto-detect and install missing dependencies"
    echo "  $0 check    # Only check what's missing"
    echo "  $0 install  # Force install missing dependencies"
    echo "  $0 setup    # Setup git hooks for automation"
}

# Parse command line arguments
COMMAND=${1:-auto}

case $COMMAND in
    "check")
        echo -e "${YELLOW}🔍 Checking for missing dependencies...${NC}"
        node "$MANAGER_SCRIPT" --check
        ;;
    "install")
        echo -e "${GREEN}📦 Installing missing dependencies...${NC}"
        node "$MANAGER_SCRIPT" --install
        ;;
    "verify")
        echo -e "${BLUE}🔐 Verifying dependency integrity...${NC}"
        node "$MANAGER_SCRIPT" --verify
        ;;
    "auto")
        echo -e "${GREEN}🚀 Auto-detecting and installing dependencies...${NC}"
        node "$MANAGER_SCRIPT"
        ;;
    "setup")
        echo -e "${BLUE}⚙️ Setting up git hooks...${NC}"
        node "$SCRIPT_DIR/scripts/install-hooks.js"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac