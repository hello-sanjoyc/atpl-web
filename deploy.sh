#!/bin/bash
set -euo pipefail

APP_ROOT="/var/www/aranax.tech"
FRONTEND_DIR="$APP_ROOT/frontend"
CMS_DIR="$APP_ROOT/cms"

ECOSYSTEM_FILE="$APP_ROOT/ecosystem.config.js"

REPO_URL="https://github.com/hello-sanjoyc/atpl-web.git"
BRANCH="main"

FRONTEND_PROCESS="AranaxTech"
CMS_PROCESS="AranaxTech-CMS"

FRONTEND_URL="http://127.0.0.1:3000"
CMS_HEALTH_URL="http://127.0.0.1:1337/_health"

echo "================================="
echo "ARANAX.TECH FULL DEPLOYMENT START"
echo "================================="
echo ""

echo "Checking required files, folders and commands"

[ -d "$APP_ROOT" ] || {
    echo "App root not found: $APP_ROOT"
    exit 1
}

[ -f "$ECOSYSTEM_FILE" ] || {
    echo "Ecosystem file not found: $ECOSYSTEM_FILE"
    exit 1
}

command -v git >/dev/null 2>&1 || {
    echo "git is not installed"
    exit 1
}

command -v pm2 >/dev/null 2>&1 || {
    echo "pm2 is not installed"
    exit 1
}

command -v curl >/dev/null 2>&1 || {
    echo "curl is not installed"
    exit 1
}

echo ""
echo "Checking PNPM"

if ! command -v pnpm >/dev/null 2>&1; then
    command -v corepack >/dev/null 2>&1 || {
        echo "Neither pnpm nor corepack is installed"
        exit 1
    }

    echo "PNPM not found. Enabling Corepack..."
    corepack enable
fi

command -v pnpm >/dev/null 2>&1 || {
    echo "pnpm not found after enabling Corepack"
    exit 1
}

echo "PNPM version: $(pnpm --version)"

echo ""
echo "Creating log directories"

mkdir -p "$APP_ROOT/logs/frontend"
mkdir -p "$APP_ROOT/logs/cms"

echo ""
echo "Pulling frontend and CMS from Git repository"

cd "$APP_ROOT"

if [ ! -d ".git" ]; then
    git init
    git remote add origin "$REPO_URL"
fi

git remote set-url origin "$REPO_URL"

git sparse-checkout init --cone
git sparse-checkout set frontend cms

git fetch --prune origin "$BRANCH"
git reset --hard "origin/$BRANCH"

[ -d "$FRONTEND_DIR" ] || {
    echo "Frontend directory not found after pull: $FRONTEND_DIR"
    exit 1
}

[ -d "$CMS_DIR" ] || {
    echo "CMS directory not found after pull: $CMS_DIR"
    exit 1
}

echo ""
echo "================================="
echo "FRONTEND DEPLOYMENT START"
echo "================================="

cd "$FRONTEND_DIR"

[ -f package.json ] || {
    echo "Frontend package.json not found"
    exit 1
}

echo ""
echo "Installing frontend dependencies with PNPM"

if [ -f pnpm-lock.yaml ]; then
    pnpm install --frozen-lockfile
else
    pnpm install
fi

echo ""
echo "Building Next.js frontend"

rm -rf .next
NODE_ENV=production pnpm build

echo ""
echo "Reloading frontend PM2 process: $FRONTEND_PROCESS"

if pm2 describe "$FRONTEND_PROCESS" >/dev/null 2>&1; then
    pm2 reload "$ECOSYSTEM_FILE" \
        --only "$FRONTEND_PROCESS" \
        --update-env
else
    pm2 start "$ECOSYSTEM_FILE" \
        --only "$FRONTEND_PROCESS"
fi

echo "Frontend PM2 process reloaded or started successfully"

echo ""
echo "Checking frontend health"

FRONTEND_READY=false

for attempt in {1..12}; do
    if curl --silent --show-error --fail \
        --max-time 5 \
        "$FRONTEND_URL" >/dev/null; then
        FRONTEND_READY=true
        break
    fi

    echo "Frontend not ready yet (attempt $attempt/12)"
    sleep 2
done

if [ "$FRONTEND_READY" != "true" ]; then
    echo "Frontend health check failed: $FRONTEND_URL"
    pm2 logs "$FRONTEND_PROCESS" --lines 50 --nostream || true
    exit 1
fi

echo "Frontend is healthy"

echo ""
echo "================================="
echo "STRAPI CMS DEPLOYMENT START"
echo "================================="

cd "$CMS_DIR"

[ -f package.json ] || {
    echo "CMS package.json not found"
    exit 1
}

echo ""
echo "Installing CMS dependencies with PNPM"

if [ -f pnpm-lock.yaml ]; then
    pnpm install --frozen-lockfile
else
    pnpm install
fi

echo ""
echo "Building Strapi CMS"

NODE_ENV=production pnpm build

echo ""
echo "Reloading CMS PM2 process: $CMS_PROCESS"

if pm2 describe "$CMS_PROCESS" >/dev/null 2>&1; then
    pm2 reload "$ECOSYSTEM_FILE" \
        --only "$CMS_PROCESS" \
        --update-env
else
    pm2 start "$ECOSYSTEM_FILE" \
        --only "$CMS_PROCESS"
fi

echo "CMS PM2 process reloaded or started successfully"

echo ""
echo "Checking Strapi health"

CMS_READY=false

for attempt in {1..15}; do
    if curl --silent --show-error --fail \
        --max-time 5 \
        "$CMS_HEALTH_URL" >/dev/null; then
        CMS_READY=true
        break
    fi

    echo "CMS not ready yet (attempt $attempt/15)"
    sleep 2
done

if [ "$CMS_READY" != "true" ]; then
    echo "Strapi health check failed: $CMS_HEALTH_URL"
    pm2 logs "$CMS_PROCESS" --lines 50 --nostream || true
    exit 1
fi

echo "Strapi CMS is healthy"

echo ""
echo "Saving PM2 process list"

pm2 save

echo ""
echo "================================="
echo "ARANAX.TECH FULL DEPLOYMENT END"
echo "================================="
echo ""

pm2 status