#!/bin/bash

## run general update/upgrade
sudo apt-get update
sudo apt-get -y upgrade

## install build tools
sudo apt-get install -y build-essential

## add nodejs 6.x repo and install
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

## install npm
sudo apt-get install -y npm

## add mongodb key,repo,etc and install
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
sudo apt-get update
sudo apt-get install -y mongodb-org
