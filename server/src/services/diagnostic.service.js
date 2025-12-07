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

const checkReverseDns = async () => {
  try {
    // 1. Get Public IP (using an external echo service)
    // Note: Node 18+ required for native fetch. 
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const ip = data.ip;

    if (!ip) throw new Error('Could not determine public IP');

    // 2. Perform Reverse Lookup (PTR)
    let hostnames = [];
    try {
        hostnames = await dns.reverse(ip);
    } catch(err) {
        // If reverse fails, it usually means no PTR record exists
        return { 
            status: 'error', 
            message: `No PTR Record found for IP ${ip}.`,
            ip,
            ptrs: [],
            help: 'You must log in to your VPS/Cloud Provider (AWS, DigitalOcean, etc.) and set the "PTR Record" or "Reverse DNS" for your IP address to match your hostname.'
        };
    }

    if (hostnames.length === 0) {
        return { 
            status: 'error', 
            message: `No PTR Record found for IP ${ip}.`,
            ip,
            ptrs: [],
            help: 'You must log in to your VPS/Cloud Provider (AWS, DigitalOcean, etc.) and set the "PTR Record" or "Reverse DNS" for your IP address to match your hostname.'
        };
    }

    return {
        status: 'ok',
        message: `PTR Record found: ${hostnames.join(', ')}`,
        ip,
        ptrs: hostnames
    };
  } catch (e) {
    return { status: 'warning', message: 'Check failed: ' + e.message, ip: 'Unknown', ptrs: [] };
  }
};

module.exports = { checkDnsResolution, checkOutboundPort25, checkReverseDns };