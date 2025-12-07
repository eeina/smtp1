const jwt = require('jsonwebtoken');

const authenticateClient = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access Denied: No Token Provided' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (!verified.client_id) return res.status(403).json({ error: 'Access Denied: Invalid Token Type' });
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};

const authenticateWebmail = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access Denied: No Token Provided' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (!verified.mailbox_id) return res.status(403).json({ error: 'Access Denied: Invalid Token Type' });
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};

module.exports = { authenticateClient, authenticateWebmail };
