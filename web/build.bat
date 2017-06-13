set NODE_PATH=%userprofile%\AppData\Roaming\npm\node_modules
rollup src/admin/index.js -w -f iife -o dist/admin.js
