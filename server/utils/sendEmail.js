const { Resend } = require('resend');

const sendEmail = async (options) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'SecondBrain <onboarding@resend.dev>', // Use Resend's test domain or your verified domain
      to: options.email,
      subject: options.subject,
      html: options.html || `<p>${options.message}</p>`,
    });
    console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error('Email send failed:', error);
    throw error;
  }
};

module.exports = sendEmail;
