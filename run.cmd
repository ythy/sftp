@echo off

SET base=%~dp0
SET files=index.html,assets/1.0.2
SET version=1.0.0
rem cd /d %base%/sources/

call node ./bin/run -t buyerExpMenu -n %version%

pause