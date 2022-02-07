#!/usr/bin/bash

RED='\033[0;31m'
BLUE='\033[1;36m'
GREEN='\033[1;32m'
NC='\033[0m'

git --version 2>&1 >/dev/null # improvement by tripleee
GIT_IS_AVAILABLE=$?
if [ $GIT_IS_AVAILABLE -ne 0 ]
    then printf "${RED}[-]${NC} 'git' is not installed\n"
    exit 1
fi

printf "${BLUE}[+]${NC} pulling from the 'origin master' \n"
git pull origin master


if ! [ -x "$(command -v node)" ]; then
    printf "${RED}[-]${NC} 'node' is not installed\n"
    exit 1
fi

if ! [ -x "$(command -v npm)" ]; then
    printf "${RED}[-]${NC} 'npm' is not installed\n"
    exit 1
fi

if ! [ -x "$(command -v yarn)" ]; then
    printf "${BLUE}[+]${NC} setting up yarn via npm \n"
    sudo npm install yarn --global
fi

yarn


printf "${BLUE}[+]${NC} about to package the application \n"
yarn run package
printf "${GREEN}[+]${NC} packaging completed.... \n"

cd out/*/

printf "${BLUE}[+]${NC} linking the package \n"
sudo ln -s "$(pwd)/auto-bell" "/usr/local/bin/auto-bell"
printf "${GREEN}[+]${NC} linking the complete \n"

cd -

printf "[Desktop Entry]\nName=icmu-autobell\nExec=auto-bell\nComment=\nTerminal=false\nIcon=$(pwd)/assets/icon.png\nType=Application\n" > icmu-autobell.desktop
mv icmu-autobell.desktop ~/.local/share/applications/