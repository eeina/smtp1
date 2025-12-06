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
    // A record might be split into chunks, but usually a token is short enough to be in one.
    // However, checking strictly:
    const flatRecords = records.map(chunk => chunk.join(''));
    
    // Check if any record equals the token or contains it (depending on strictness reqs)
    // Often verification requires exact match or "verification=TOKEN" format.
    // Based on prompt "check if the token exists", strict inclusion is safest.
    return flatRecords.some(record => record.includes(token));
  } catch (error) {
    // Domain not found or no TXT records
    return false;
  }
};

/**
 * Fetches MX records to see if they exist.
 * Mocks the IP check by returning true if any MX record exists.
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

module.exports = {
  generateVerificationToken,
  verifyDomainDns,
  checkMxRecord,
  generateDkimKeys
};