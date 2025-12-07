const winston = require('winston');
const Transport = require('winston-transport');

// Custom Transport to save logs to MongoDB
class MongoTransport extends Transport {
  constructor(opts) {
    super(opts);
  }
 
  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      // Lazy load model to ensure mongoose connection exists
      const SystemLog = require('../models/SystemLog');
      
      // Clean up meta to ensure circular structures don't break insert
      const { level, message, ...meta } = info;
      
      SystemLog.create({
        level,
        message,
        meta
      }).catch(err => {
        // Fallback to console if DB fails, to avoid infinite loop
        console.error('Failed to write log to DB:', err.message);
      });

    } catch(e) {
      console.error("MongoTransport error", e);
    }
    
    callback();
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'smtp-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new MongoTransport() // Add our custom transport
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
} else {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
