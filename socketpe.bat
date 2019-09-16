cd node-v10.16.3-win-x64
color 03
REM cls
echo Installing dependencies...
call npm install --prefix ../ express socket.io uuid ws open
color 07
REM cls
node ../index.js %1