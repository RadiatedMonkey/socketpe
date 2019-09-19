@echo off

cd node-v10.16.3-win-x64
call node ../index.js %1 %2 %3
cd ..