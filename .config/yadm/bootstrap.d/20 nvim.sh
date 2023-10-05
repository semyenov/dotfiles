#!/bin/zsh

echo "↳ Installing AstroNvim"

if [[ ! -d "$HOME/.config/nvim" ]]; then
    echo "Cloning AstroNvim into ~/.config/nvim"
    git clone --depth 1 https://github.com/AstroNvim/AstroNvim ~/.config/nvim
fi