import app from './app.js';
import http from 'http';
import { ConfigIniParser } from 'config-ini-parser';
import fs from 'fs';
import ShorttpdConfig from './util/confReader.js';

const configReader = new ShorttpdConfig();
const port = normalizePort(configReader.config.data.addresses.bind_port);
const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
/*
server.on('connection', (sock) => {
    const ip = sock.remoteAddress;
    console.log(ip);
});
*/

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  console.log(addr)
  var bind = typeof addr === 'string'
    ? 'Pipe ' + addr
    : 'Port ' + addr.port;
  console.debug('Listening on ' + bind);
}