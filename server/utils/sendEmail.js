const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: options.email,
    from: 'noreply@secondbrain.app', // Use a verified sender or SendGrid's test email
    subject: options.subject,
    html: options.html || `<p>${options.message}</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error.message);
    throw error;
  }
};

module.exports = sendEmail;
