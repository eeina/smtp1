const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const EmailLog = require('../models/EmailLog');
const logger = require('../config/logger');

const smtp = new SMTPServer({
  secure: false,
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  onData(stream, session, callback) {
    simpleParser(stream, async (err, parsed) => {
      if (err) {
        logger.error('Parsed Error:', err);
        return callback(new Error('Error parsing email'));
      }

      try {
        await EmailLog.create({
          from: parsed.from ? parsed.from.text : '',
          to: parsed.to ? parsed.to.text : '',
          subject: parsed.subject || '',
          html: parsed.html || '',
          text: parsed.text || '',
          status: 'received'
        });

        logger.info(`SAVED TO DB: ${parsed.subject}`);
        callback();
      } catch (error) {
        logger.error('Database Error:', error);
        callback(new Error('Error saving to database'));
      }
    });
  }
});

module.exports = smtp;