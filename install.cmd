@echo off

color 03
cd node-v10.16.3-win-x64
cls
echo Installing dependencies...
call npm install --prefix ../ express socket.io uuid ws
cd ..
cls
echo Done, running 'socketpe ui' to start the server
color 07
socketpe ui