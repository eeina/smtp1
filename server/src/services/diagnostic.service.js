const dns = require('dns').promises;
const net = require('net');

const checkDnsResolution = async () => {
  try {
    await dns.resolve('google.com');
    return { status: 'ok', message: 'DNS Resolution working' };
  } catch (e) {
    return { status: 'error', message: 'DNS Resolution failed: ' + e.message };
  }
};

const checkOutboundPort25 = async () => {
  return new Promise((resolve) => {
    // We try to connect to Gmail's primary MX server. 
    // If this fails, it's a strong indicator that Port 25 is blocked by the cloud provider.
    const targetHost = 'gmail-smtp-in.l.google.com';
    const socket = new net.Socket();
    
    // Set timeout to 4 seconds
    socket.setTimeout(4000);

    socket.on('connect', () => {
      socket.destroy();
      resolve({ status: 'ok', message: 'Outbound Port 25 is Open' });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: 'error', message: 'Outbound Port 25 Timed Out (Blocked by ISP/Cloud Provider)' });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ status: 'error', message: `Connection Failed: ${err.message}` });
    });

    try {
        socket.connect(25, targetHost);
    } catch(e) {
        resolve({ status: 'error', message: `Socket Error: ${e.message}` });
    }
  });
};

module.exports = { checkDnsResolution, checkOutboundPort25 };
