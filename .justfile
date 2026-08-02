_default:
    @just --list

build-firefox:
    mkdir -p dist
    cp -f manifest-firefox.json manifest.json
    sed -i "s/@VERSION@/`cat VERSION`/g" manifest.json
    sed -i "s/@VERSION@/`cat VERSION`/g" README.md
    rm -rf extension
    zip -r dist/zororo-firefox.zip src icons popup.html options.html manifest.json
    rm -f manifest.json

build-chrome:
    mkdir -p dist
    cp -f manifest-chrome.json manifest.json
    sed -i "s/@VERSION@/`cat VERSION`/g" manifest.json
    sed -i "s/@VERSION@/`cat VERSION`/g" README.md
    rm -rf extension
    zip -r dist/zororo-chrome.zip src icons popup.html options.html manifest.json
    rm -f manifest.json

dev-firefox:
    rm -rf extension
    mkdir -p extension
    cp -r src icons popup.html options.html extension/
    cp manifest-firefox.json extension/manifest.json
    sed -i "s/@VERSION@/`cat VERSION`/g" extension/manifest.json

dev-chrome:
    rm -rf extension
    mkdir -p extension
    cp -r src icons popup.html options.html extension/
    cp manifest-chrome.json extension/manifest.json
    sed -i "s/@VERSION@/`cat VERSION`/g" extension/manifest.json