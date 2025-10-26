#!/bin/bash

# ========================================
# SCRIPT DE TEST PARA GITHUB ACTIONS
# ========================================
# Este script simula las verificaciones que hace GitHub Actions

set -e

echo "🧪 Testing GitHub Actions Workflow Compatibility"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Función para test
run_test() {
    local name=$1
    local command=$2
    
    echo -n "🧪 Testing: $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "📋 Environment Tests"
echo "===================="

# Test 1: Java instalado
run_test "Java 17+ installed" "java -version 2>&1 | grep -E 'version \"(1[7-9]|[2-9][0-9])'"

# Test 2: Node.js instalado
run_test "Node.js 18+ installed" "node --version | grep -E 'v(1[8-9]|[2-9][0-9])'"

# Test 3: Docker instalado
run_test "Docker installed" "docker --version"

# Test 4: Docker daemon corriendo
run_test "Docker daemon running" "docker ps"

# Test 5: Maven wrapper ejecutable
run_test "Maven wrapper executable" "test -x backend/mvnw"

echo ""
echo "🔨 Build Tests"
echo "=============="

# Test 6: Backend compila
echo -n "🧪 Testing: Backend compiles... "
cd backend
if ./mvnw clean compile -DskipTests > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
cd ..

# Test 7: Frontend instala dependencias
echo -n "🧪 Testing: Frontend dependencies install... "
cd frontend
if npm ci --prefer-offline --no-audit > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 8: Frontend compila
echo -n "🧪 Testing: Frontend builds... "
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
cd ..

echo ""
echo "📋 File Tests"
echo "============="

# Test 9: Workflows existen
run_test "CI/CD workflow exists" "test -f .github/workflows/deploy.yml"
run_test "Monitor workflow exists" "test -f .github/workflows/monitor.yml"

# Test 10: Deploy script existe
run_test "Deploy script exists" "test -f deploy-server.sh"

# Test 11: Docker compose files existen
run_test "Dev compose file exists" "test -f docker-compose.dev.yml"
run_test "Prod compose file exists" "test -f docker-compose.prod.yml"

echo ""
echo "📊 Results Summary"
echo "=================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for GitHub Actions${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Fix issues before pushing${NC}"
    exit 1
fi
