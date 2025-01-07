#!/usr/bin/env bash

sudo rm -rf artifacts && echo 'Deleted artifacts folder'

sudo rm -rf work && echo 'Deleted work folder'

act --bind \
 --artifact-server-path artifacts \
 --artifact-server-addr 0.0.0.0 \
 --artifact-server-port 4322 \
 --input notion_version=3.9.1 \
 --input custom_version=1.0.0 \
 --input notion_enhancer_commit=7fe9bb2543cbc8f0c74adb0b90104281528c4af3 \
 --workflows ./.github/workflows/prepare-release.yml \
 --detect-event
