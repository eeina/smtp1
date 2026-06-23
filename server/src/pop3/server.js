const net = require('net');
const Mailbox = require('../models/Mailbox');
const EmailMessage = require('../models/EmailMessage');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

function constructMime(msg) {
  const dateStr = new Date(msg.created_at).toUTCString();
  let mime = `From: ${msg.from}\r\n`;
  mime += `To: ${msg.to}\r\n`;
  mime += `Subject: ${msg.subject || '(No Subject)'}\r\n`;
  mime += `Date: ${dateStr}\r\n`;
  mime += `Message-ID: <${msg._id}@mail.eeina.com>\r\n`;
  mime += `MIME-Version: 1.0\r\n`;

  if (msg.html_body && msg.text_body) {
    const boundary = `----=_Part_${msg._id}`;
    mime += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
    mime += `--${boundary}\r\n`;
    mime += `Content-Type: text/plain; charset=UTF-8\r\n`;
    mime += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    mime += `${msg.text_body}\r\n\r\n`;
    mime += `--${boundary}\r\n`;
    mime += `Content-Type: text/html; charset=UTF-8\r\n`;
    mime += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    mime += `${msg.html_body}\r\n\r\n`;
    mime += `--${boundary}--\r\n`;
  } else if (msg.html_body) {
    mime += `Content-Type: text/html; charset=UTF-8\r\n`;
    mime += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    mime += `${msg.html_body}\r\n`;
  } else {
    mime += `Content-Type: text/plain; charset=UTF-8\r\n`;
    mime += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    mime += `${msg.text_body || ''}\r\n`;
  }
  return mime;
}

const start = (port = 110) => {
  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');

    let state = 'AUTHORIZATION'; // AUTHORIZATION, TRANSACTION, UPDATE
    let username = '';
    let messages = []; // cached in transaction
    let deletedIds = new Set();

    socket.write('+OK POP3 server ready\r\n');

    let buffer = '';

    socket.on('data', async (chunk) => {
      buffer += chunk;
      while (buffer.indexOf('\n') !== -1) {
        const lineIndex = buffer.indexOf('\n');
        const line = buffer.substring(0, lineIndex).trim();
        buffer = buffer.substring(lineIndex + 1);

        const parts = line.split(' ');
        const cmd = parts[0].toUpperCase();
        const arg = parts.slice(1).join(' ');

        try {
          if (state === 'AUTHORIZATION') {
            if (cmd === 'USER') {
              username = arg.trim().toLowerCase();
              socket.write('+OK Name is a valid mailbox\r\n');
            } else if (cmd === 'PASS') {
              if (!username) {
                socket.write('-ERR USER command first\r\n');
                continue;
              }
              const pass = arg;
              const mailbox = await Mailbox.findOne({ email: username });
              if (!mailbox) {
                socket.write('-ERR invalid username or password\r\n');
                continue;
              }

              const isMatch = await bcrypt.compare(pass, mailbox.password_hash);
              if (!isMatch) {
                socket.write('-ERR invalid username or password\r\n');
                continue;
              }

              // Load all active inbox messages
              const rawMsgs = await EmailMessage.find({ mailbox_id: mailbox._id, folder: 'inbox' }).sort({ created_at: 1 });
              
              messages = rawMsgs.map((m) => {
                const mime = constructMime(m);
                return {
                  model: m,
                  mime,
                  size: Buffer.byteLength(mime)
                };
              });

              state = 'TRANSACTION';
              socket.write(`+OK Mailbox logged in, ${messages.length} messages\r\n`);
            } else if (cmd === 'QUIT') {
              socket.write('+OK farewell\r\n');
              socket.end();
            } else {
              socket.write('-ERR unauthorized command\r\n');
            }
          } else if (state === 'TRANSACTION') {
            if (cmd === 'STAT') {
              const activeMsgs = messages.filter((_, i) => !deletedIds.has(i));
              const totalSize = activeMsgs.reduce((sum, m) => sum + m.size, 0);
              socket.write(`+OK ${activeMsgs.length} ${totalSize}\r\n`);
            } else if (cmd === 'LIST') {
              if (arg) {
                const idx = parseInt(arg) - 1;
                if (isNaN(idx) || idx < 0 || idx >= messages.length || deletedIds.has(idx)) {
                  socket.write('-ERR no such message\r\n');
                } else {
                  socket.write(`+OK ${idx + 1} ${messages[idx].size}\r\n`);
                }
              } else {
                socket.write(`+OK mail listing follows\r\n`);
                messages.forEach((m, idx) => {
                  if (!deletedIds.has(idx)) {
                    socket.write(`${idx + 1} ${m.size}\r\n`);
                  }
                });
                socket.write('.\r\n');
              }
            } else if (cmd === 'UIDL') {
              if (arg) {
                const idx = parseInt(arg) - 1;
                if (isNaN(idx) || idx < 0 || idx >= messages.length || deletedIds.has(idx)) {
                  socket.write('-ERR no such message\r\n');
                } else {
                  socket.write(`+OK ${idx + 1} ${messages[idx].model._id}\r\n`);
                }
              } else {
                socket.write(`+OK unique-id listing follows\r\n`);
                messages.forEach((m, idx) => {
                  if (!deletedIds.has(idx)) {
                    socket.write(`${idx + 1} ${m.model._id}\r\n`);
                  }
                });
                socket.write('.\r\n');
              }
            } else if (cmd === 'RETR') {
              const idx = parseInt(arg) - 1;
              if (isNaN(idx) || idx < 0 || idx >= messages.length || deletedIds.has(idx)) {
                socket.write('-ERR no such message\r\n');
              } else {
                const m = messages[idx];
                socket.write(`+OK ${m.size} octets\r\n`);
                socket.write(m.mime + '\r\n.\r\n');
              }
            } else if (cmd === 'TOP') {
              const parts = arg.split(' ');
              const idx = parseInt(parts[0]) - 1;
              const lines = parseInt(parts[1]) || 0;
              if (isNaN(idx) || idx < 0 || idx >= messages.length || deletedIds.has(idx)) {
                socket.write('-ERR no such message\r\n');
              } else {
                const m = messages[idx];
                const mimeParts = m.mime.split('\r\n\r\n');
                const headers = mimeParts[0];
                const body = mimeParts.slice(1).join('\r\n\r\n');
                const bodyLines = body.split('\r\n').slice(0, lines).join('\r\n');

                socket.write(`+OK headers plus ${lines} lines follow\r\n`);
                socket.write(headers + '\r\n\r\n' + bodyLines + '\r\n.\r\n');
              }
            } else if (cmd === 'DELE') {
              const idx = parseInt(arg) - 1;
              if (isNaN(idx) || idx < 0 || idx >= messages.length || deletedIds.has(idx)) {
                socket.write('-ERR no such message\r\n');
              } else {
                deletedIds.add(idx);
                socket.write(`+OK message ${idx + 1} marked for deletion\r\n`);
              }
            } else if (cmd === 'RSET') {
              deletedIds.clear();
              socket.write('+OK un-deleted all messages\r\n');
            } else if (cmd === 'NOOP') {
              socket.write('+OK\r\n');
            } else if (cmd === 'QUIT') {
              state = 'UPDATE';
              for (const idx of deletedIds) {
                const m = messages[idx];
                m.model.folder = 'trash';
                await m.model.save();
              }
              socket.write('+OK connection closed\r\n');
              socket.end();
            } else {
              socket.write('-ERR unknown transaction command\r\n');
            }
          }
        } catch (err) {
          logger.error('POP3 command error:', err);
          socket.write('-ERR internal error processing command\r\n');
        }
      }
    });

    socket.on('error', (err) => {
      logger.error('POP3 socket error:', err);
    });
  });

  server.listen(port, '0.0.0.0', () => {
    logger.info(`POP3 Incoming Server running on port ${port}`);
  });
};

module.exports = { start };
