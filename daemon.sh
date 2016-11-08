#/!bin/sh

forever stop app.js
git pull
forever start app.js