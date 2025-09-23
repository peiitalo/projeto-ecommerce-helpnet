import sgMail from '@sendgrid/mail';

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key');

// Fallback para Ethereal se não houver SendGrid
import nodemailer from 'nodemailer';
const etherealTransporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ETHEREAL_USER || 'your-ethereal-user',
    pass: process.env.ETHEREAL_PASS || 'your-ethereal-pass'
  }
});

// Função para enviar email de reset de senha
export const enviarEmailResetSenha = async (email, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    to: email,
    from: {
      email: process.env.FROM_EMAIL || 'noreply@helpnet.com',
      name: 'HelpNet'
    },
    subject: 'Redefinição de Senha - HelpNet',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Redefinição de Senha</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir sua senha no HelpNet.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Redefinir Senha</a>
        </div>
        <p>Este link é válido por 1 hora.</p>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
        <p>Atenciosamente,<br>Equipe HelpNet</p>
      </div>
    `
  };

  try {
    // Tentar SendGrid primeiro
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key') {
      const result = await sgMail.send(mailOptions);
      console.log('Email enviado via SendGrid:', result[0]?.headers?.['x-message-id']);
      console.log('Token de reset:', resetToken);
      return { success: true, messageId: result[0]?.headers?.['x-message-id'] };
    } else if (process.env.ETHEREAL_USER && process.env.ETHEREAL_USER !== 'your-ethereal-user' &&
               process.env.ETHEREAL_PASS && process.env.ETHEREAL_PASS !== 'your-ethereal-pass') {
      // Fallback para Ethereal se credenciais estiverem configuradas
      const info = await etherealTransporter.sendMail({
        ...mailOptions,
        from: '"HelpNet" <noreply@helpnet.com>'
      });
      console.log('Email enviado via Ethereal:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('Token de reset:', resetToken);
      return { success: true, messageId: info.messageId };
    } else {
      // Em desenvolvimento, apenas logar o token se não houver configuração de email
      console.log('=== EMAIL RESET SENHA (DESENVOLVIMENTO) ===');
      console.log('Para:', email);
      console.log('Token de reset:', resetToken);
      console.log('Link de reset:', resetLink);
      console.log('=====================================');
      console.log('Configure SENDGRID_API_KEY ou ETHEREAL_USER/ETHEREAL_PASS para enviar emails reais.');
      return { success: true, messageId: 'development-mode' };
    }
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    console.log('Token de reset (fallback):', resetToken);
    throw error;
  }
};

export default { enviarEmailResetSenha };