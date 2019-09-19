@echo off

cd ../node-v10.16.3-win-x64
call npm %1 --prefix ../dependencies %2
cd ../dependencies