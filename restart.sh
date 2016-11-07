#!/bin/sh
cd /home/Sites/pi-rfoutlet
git pull
sudo forever restart 9X0H
