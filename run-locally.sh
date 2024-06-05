#!/usr/bin/env bash

sudo rm -rf artifacts && echo 'Deleted artifacts folder'

sudo rm -rf work && echo 'Deleted work folder'

ACTIONS_RUNTIME_URL=http://host.docker.internal:4322/ gh act --bind \
 --artifact-server-path artifacts \
 --artifact-server-addr 0.0.0.0 \
 --artifact-server-port 4322 \
 --input notion_version=3.9.1 \
 --input custom_version=1.0.0
