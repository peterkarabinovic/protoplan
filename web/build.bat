set NODE_PATH=%userprofile%\AppData\Roaming\npm\node_modules
start rollup src/admin/index.js -w -f iife -o dist/admin.js
start rollup src/index2.js -w -f iife -o dist/index2.js
