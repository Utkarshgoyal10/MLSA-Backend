import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: `${process.env.EMAIL_HOST_NAME}`, 
    port: 465, 
    secure: true, 
  auth: {
    user: `${process.env.EMAIL_USER_NAME}` ,
    pass: `${process.env.EMAIL_PASS}`,
  },
});


  
