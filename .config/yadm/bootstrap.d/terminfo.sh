#!/bin/sh

if [ -f "$HOME/.terminfo/kitty.terminfo" ]; then
  echo "Updating terminfo"
  tic "$HOME/.terminfo/kitty.terminfo"
fi
