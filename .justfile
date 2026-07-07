_default:
    @just --list

build-firefox:
    mkdir -p dist
    cp -f manifest.firefox.json manifest.json
    zip -r dist/zororo-firefox.zip . -x manifest-chrome.json manifest.firefox.json '.git/*' dist/* .justfile .gitignore README.md PRIVACY.md '.github/*'

build-chrome:
    mkdir -p dist
    cp -f manifest-chrome.json manifest.json
    zip -r dist/zororo-chrome.zip . -x manifest-chrome.json manifest.firefox.json '.git/*' dist/* .justfile .gitignore README.md PRIVACY.md '.github/*'

dev-firefox:
    cp -f manifest.firefox.json manifest.json

dev-chrome:
    cp -f manifest-chrome.json manifest.json
