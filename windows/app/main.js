// MultiGridView entry point.
//   MultiGridView.exe            -> the stream grid
//   MultiGridView.exe --alerts   -> the go-live alerts tray app (runs on its own)
if (process.argv.includes('--alerts')) require('./alerts-main.js');
else require('./grid-main.js');
