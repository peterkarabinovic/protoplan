set NODE_PATH=%userprofile%\AppData\Roaming\npm\node_modules
REM start rollup src/index.js -w -f iife -o dist/index.js
REM start rollup src/index2.js -w -f iife -o dist/index2.js
start rollup src/test.js -w -f iife -o dist/test.js
