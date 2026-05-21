const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

// Email templates
const emailTemplates = {
  examSubmitted: (studentName, studentNumber, score, status) => ({
    subject: `Mining Safety Exam Results - ${studentName}`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;"><h2>Mining Safety Academy</h2><p>Exam Results Notification</p></div><div style="padding: 20px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 5px 5px;"><p>Dear ${studentName},</p><p>Your exam has been submitted and graded. Here are your results:</p><div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0;"><p><strong>Student Number:</strong> ${studentNumber}</p><p><strong>Score:</strong> ${score} / 100</p><p><strong>Status:</strong> <span style="color: ${status === 'PASSED' ? 'green' : 'red'}; font-weight: bold;">${status}</span></p><p><strong>Pass Mark Required:</strong> 40/100</p></div>${status === 'PASSED' ? '<p style="color: green;"><strong>✅ Congratulations!</strong> Your certificate is now pending admin approval. You will receive another email once it is ready for download.</p>' : '<p style="color: #d9534f;"><strong>⏳ You did not pass this attempt.</strong> You can retake the exam. Review the lessons and try again.</p>'}<p style="margin-top: 20px; color: #666; font-size: 12px;">If you have questions, contact our support team.</p><p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">Best regards,<br/>Mining Safety Academy</p></div></div>`
  }),
  
  examSubmittedAdmin: (studentName, studentNumber, score, status) => ({
    subject: `NEW EXAM SUBMISSION - ${studentName} (${studentNumber})`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;"><h2>Mining Safety Academy</h2><p>New Exam Submission Alert</p></div><div style="padding: 20px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 5px 5px;"><p>A learner has submitted their exam.</p><div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0;"><p><strong>Student:</strong> ${studentName}</p><p><strong>Student Number:</strong> ${studentNumber}</p><p><strong>Score:</strong> ${score} / 100</p><p><strong>Status:</strong> <span style="color: ${status === 'PASSED' ? 'green' : 'red'}; font-weight: bold;">${status}</span></p><p><strong>Date:</strong> ${new Date().toLocaleString()}</p></div><p style="margin-top: 20px;"><a href="${process.env.FRONTEND_URL}/admin/results" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">View in Dashboard</a></p></div></div>`
  }),
  
  certificateReady: (studentName, studentNumber, certificateNumber) => ({
    subject: `Your Mining Safety Certificate is Ready - ${certificateNumber}`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;"><h2>Mining Safety Academy</h2><p>Certificate Ready for Download</p></div><div style="padding: 20px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 5px 5px;"><p>Dear ${studentName},</p><p style="color: green; font-weight: bold; font-size: 18px;">✅ Your certificate is now ready!</p><div style="background: white; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;"><p><strong>Certificate Reference:</strong> ${certificateNumber}</p><p><strong>Student Number:</strong> ${studentNumber}</p><p><strong>Course:</strong> Mining Safety Certification</p></div><p>You can now download your certificate from your profile dashboard.</p><p style="margin-top: 20px;"><a href="${process.env.FRONTEND_URL}/student/certificates" style="display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">Download Certificate</a></p><p style="margin-top: 20px; color: #666; font-size: 12px;">Congratulations on completing the Mining Safety Certification!</p></div></div>`
  }),

  registrationConfirmation: (studentName, studentNumber) => ({
    subject: 'Welcome to Mining Safety Academy',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;"><h2>Mining Safety Academy</h2><p>Welcome to Our Learning Platform</p></div><div style="padding: 20px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 5px 5px;"><p>Dear ${studentName},</p><p>Welcome to the Mining Safety Learning Platform! Your account has been created successfully.</p><div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0;"><p><strong>Your Student Number:</strong> <span style="font-weight: bold; font-size: 16px; color: #667eea;">${studentNumber}</span></p><p>Please keep this number safe. You will need it for all future communications.</p></div><p>Your next step is to:</p><ol><li>Log in to your account</li><li>Review the 5 mining safety modules</li><li>Take the final exam (50 questions, 2 hours)</li><li>Receive your certificate upon passing</li></ol><p style="margin-top: 20px;"><a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px;">Log In Now</a></p></div></div>`
  })
};

// Function to send emails
async function sendEmail(recipientEmail, templateName, ...templateArgs) {
  try {
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const mailOptions = template(...templateArgs);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      ...mailOptions,
    });

    console.log(`✅ Email sent to ${recipientEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${recipientEmail}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  transporter,
  sendEmail,
  emailTemplates,
};
