_default:
    @just --list

build-chrome:
    cp manifest.json manifest.chrome.json
    cp manifest.firefox.json manifest.json
    zip -r ../zororo-chrome.zip . -x manifest.chrome.json manifest.firefox.json
    mv manifest.chrome.json manifest.json

build-firefox:
    cp manifest.json manifest.chrome.json
    cp manifest.firefox.json manifest.json
    zip -r ../zororo-firefox.zip . -x manifest.chrome.json manifest.firefox.json
    mv manifest.chrome.json manifest.json
