_default:
    @just --list

build-firefox:
    mkdir -p dist
    cp -f manifest.firefox.json manifest.json
    rm -rf extension
    zip -r dist/zororo-firefox.zip src icons popup.html options.html manifest.json
    rm -f manifest.json

build-chrome:
    mkdir -p dist
    cp -f manifest-chrome.json manifest.json
    rm -rf extension
    zip -r dist/zororo-chrome.zip src icons popup.html options.html manifest.json
    rm -f manifest.json

dev-firefox:
    rm -rf extension
    mkdir -p extension
    cp -r src icons popup.html options.html extension/
    cp manifest.firefox.json extension/manifest.json

dev-chrome:
    rm -rf extension
    mkdir -p extension
    cp -r src icons popup.html options.html extension/
    cp manifest-chrome.json extension/manifest.json
