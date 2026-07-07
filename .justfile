_default:
    @just --list

build-chrome:
    zip -r ../zororo-chrome.zip . -x manifest.firefox.json '.git/*' .justfile README.md PRIVACY.md '.github/*'

build-firefox:
    cp manifest.json manifest.chrome.json
    cp manifest.firefox.json manifest.json
    zip -r ../zororo-firefox.zip . -x manifest.chrome.json manifest.firefox.json '.git/*' .justfile README.md PRIVACY.md '.github/*'
    mv manifest.chrome.json manifest.json
