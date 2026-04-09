const nodemailer = require('nodemailer');

// Configure transporter - uses msmtp or SMTP settings from environment
const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix',
  path: '/usr/bin/msmtp'
});

async function sendMail(to, subject, body) {
  try {
    await transporter.sendMail({
      from: 'UMBC HvZ <umbchvzofficers@gmail.com>',
      to,
      subject,
      html: body
    });
    return true;
  } catch (err) {
    console.error('Email error:', err);
    return false;
  }
}

module.exports = { sendMail };
