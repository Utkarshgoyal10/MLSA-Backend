import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.yourprovider.com', // e.g., smtp.gmail.com
    port: 465, // Secure port (SSL)
    secure: true, // true for port 465, false for other ports
  auth: {
    user: `${process.env.EMAIL_USER_NAME}` ,
    pass: `${process.env.EMAIL_PASS}`,
  },
});


  
