#!/bin/zsh

echo "- Init submodules"

cd "$HOME"
yadm submodule update --recursive --init
