#!/bin/zsh

echo "- Updating kitty terminfo"

if [ -f "$HOME/.terminfo/kitty.terminfo" ]; then
  tic "$HOME/.terminfo/kitty.terminfo"
fi
