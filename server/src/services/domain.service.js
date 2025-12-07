const dns = require('dns').promises;
const crypto = require('crypto');

/**
 * Generates a random unique verification token.
 * @returns {string} Hex string token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Fetches TXT records for the domain and checks if the token exists.
 * @param {string} domainName 
 * @param {string} token 
 * @returns {Promise<boolean>}
 */
const verifyDomainDns = async (domainName, token) => {
  try {
    // resolveTxt returns an array of arrays (chunks of text)
    const records = await dns.resolveTxt(domainName);
    
    // Flatten chunks and look for the token
    const flatRecords = records.map(chunk => chunk.join(''));
    
    // Check if any record equals the token or contains it
    return flatRecords.some(record => record.includes(token));
  } catch (error) {
    // Domain not found or no TXT records
    return false;
  }
};

/**
 * Fetches MX records to see if they exist.
 * Checks for actual MX records on the domain.
 * @param {string} domainName 
 * @returns {Promise<boolean>}
 */
const checkMxRecord = async (domainName) => {
  try {
    const records = await dns.resolveMx(domainName);
    return records && records.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Generates RSA 2048-bit key pair for DKIM.
 * @returns {{privateKey: string, publicKey: string}}
 */
const generateDkimKeys = () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { privateKey, publicKey };
};

/**
 * Checks detailed status of all required DNS records
 * @param {string} domainName
 * @param {string} token
 */
const getDnsStatus = async (domainName, token) => {
  const status = {
    verification: false,
    a_record: false,
    mx: false,
    spf: false,
    dmarc: false,
    dkim: false,
    found_mx: [],
    found_a: [],
    found_txt: []
  };

  try {
    // 1. Root TXT (Verification, SPF, DMARC, DKIM often in TXT)
    // We catch errors individually to allow partial success
    let txtRecords = [];
    try {
      txtRecords = await dns.resolveTxt(domainName);
      status.found_txt = txtRecords.map(c => c.join(''));
    } catch (e) { /* ignore */ }
    
    status.verification = status.found_txt.some(r => r.includes(token));
    status.spf = status.found_txt.some(r => r.toLowerCase().includes('v=spf1'));

    // 2. A Record (mail.domain)
    try {
      const aRecords = await dns.resolve4(`mail.${domainName}`);
      status.found_a = aRecords;
      status.a_record = aRecords.length > 0;
    } catch (e) { /* ignore */ }

    // 3. MX Record
    try {
      const mxRecords = await dns.resolveMx(domainName);
      status.found_mx = mxRecords.map(r => `${r.priority} ${r.exchange}`);
      // Valid if MX records exist and at least one points to mail.domainName
      // We check if any exchange contains 'mail.' or matches the A-record host
      status.mx = mxRecords.length > 0 && mxRecords.some(r => r.exchange && r.exchange.includes('mail.'));
    } catch (e) { /* ignore */ }

    // 4. DMARC (_dmarc.domain)
    try {
      const dmarcRecords = await dns.resolveTxt(`_dmarc.${domainName}`);
      const flatDmarc = dmarcRecords.map(c => c.join(''));
      status.dmarc = flatDmarc.some(r => r.toLowerCase().includes('v=dmarc1'));
    } catch (e) { /* ignore */ }

    // 5. DKIM (default._domainkey.domain)
    try {
      const dkimRecords = await dns.resolveTxt(`default._domainkey.${domainName}`);
      const flatDkim = dkimRecords.map(c => c.join(''));
      status.dkim = flatDkim.some(r => r.includes('v=DKIM1'));
    } catch (e) { /* ignore */ }

  } catch (err) {
    // Global failure
  }
  
  return status;
};

module.exports = {
  generateVerificationToken,
  verifyDomainDns,
  checkMxRecord,
  generateDkimKeys,
  getDnsStatus
};
