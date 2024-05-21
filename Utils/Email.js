const nodemailer = require("nodemailer");
const sendEmail = async (options) => {
  const transport = nodemailer.createTransport({
    service:"gmail",
    auth:{
      user:"burningMoon26@gmail.com",
      pass:"jxea nyud mdxa gehs",
    }});

  const mailOptions = {
    from: "Burning Moon <burningMoon26@gmail.com>", // Replace with your Gmail address
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
module.exports = sendEmail;
