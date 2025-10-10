import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key');

// Configurar SMTP transporter (Gmail, SendGrid SMTP, etc.)
const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
});

// Fallback para Ethereal se não houver configuração SMTP
const etherealTransporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ETHEREAL_USER || 'your-ethereal-user',
    pass: process.env.ETHEREAL_PASS || 'your-ethereal-pass'
  }
});

// Função auxiliar para carregar e compilar templates
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
  const baseTemplatePath = path.join(__dirname, '../templates/emails', 'base.hbs');

  try {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const baseTemplate = fs.readFileSync(baseTemplatePath, 'utf8');

    const compiledTemplate = handlebars.compile(templateContent);
    const compiledBase = handlebars.compile(baseTemplate);

    return { compiledTemplate, compiledBase };
  } catch (error) {
    console.error(`Erro ao carregar template ${templateName}:`, error);
    throw error;
  }
};

// Função auxiliar para enviar email
const sendEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    to,
    from: {
      email: process.env.FROM_EMAIL || 'noreply@helpnet.com',
      name: 'HelpNet'
    },
    subject,
    html: htmlContent
  };

  try {
    // Sempre logar detalhes do email em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== DETALHES DO EMAIL ===');
      console.log('Para:', to);
      console.log('De:', mailOptions.from);
      console.log('Assunto:', subject);
      console.log('Conteúdo HTML length:', htmlContent.length);
      console.log('========================');
    }

    // Tentar SendGrid primeiro
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key') {
      const result = await sgMail.send(mailOptions);
      console.log('Email enviado via SendGrid:', result[0]?.headers?.['x-message-id']);
      return { success: true, messageId: result[0]?.headers?.['x-message-id'], provider: 'sendgrid' };
    }

    // Tentar SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_USER !== 'your-email@gmail.com') {
      const info = await smtpTransporter.sendMail({
        ...mailOptions,
        from: `"HelpNet" <${process.env.SMTP_USER}>`
      });
      console.log('Email enviado via SMTP:', info.messageId);
      return { success: true, messageId: info.messageId, provider: 'smtp' };
    }

    // Fallback para Ethereal
    if (process.env.ETHEREAL_USER && process.env.ETHEREAL_USER !== 'your-ethereal-user') {
      const info = await etherealTransporter.sendMail({
        ...mailOptions,
        from: '"HelpNet" <noreply@helpnet.com>'
      });
      console.log('Email enviado via Ethereal:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      return { success: true, messageId: info.messageId, provider: 'ethereal' };
    }

    // Desenvolvimento: apenas logar
    console.log('=== EMAIL (DESENVOLVIMENTO) ===');
    console.log('Para:', to);
    console.log('Assunto:', subject);
    console.log('Conteúdo HTML length:', htmlContent.length);
    console.log('Configure SENDGRID_API_KEY, SMTP_* ou ETHEREAL_* para enviar emails reais.');
    return { success: true, messageId: 'development-mode', provider: 'development' };

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
};

// === FUNÇÕES DE EMAIL PARA CLIENTES ===

// Email de boas-vindas
export const sendWelcomeEmail = async (userData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('welcome');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const bodyContent = compiledTemplate({
      nome: userData.nome,
      frontendUrl
    });

    const htmlContent = compiledBase({
      title: 'Bem-vindo ao HelpNet!',
      body: bodyContent,
      showUnsubscribe: false
    });

    return await sendEmail(userData.email, 'Bem-vindo ao HelpNet! Sua conta foi criada com sucesso.', htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw error;
  }
};

// Confirmação de pedido
export const sendOrderConfirmationEmail = async (orderData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('order-confirmation');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const bodyContent = compiledTemplate({
      clienteNome: orderData.clienteNome,
      pedidoId: orderData.pedidoId,
      dataPedido: orderData.dataPedido,
      metodoPagamento: orderData.metodoPagamento,
      enderecoEntrega: orderData.enderecoEntrega,
      produtos: orderData.produtos,
      subtotal: orderData.subtotal,
      frete: orderData.frete,
      total: orderData.total,
      frontendUrl
    });

    const htmlContent = compiledBase({
      title: `Confirmação de Pedido #${orderData.pedidoId}`,
      body: bodyContent,
      showUnsubscribe: false
    });

    return await sendEmail(orderData.email, `Confirmação de Pedido #${orderData.pedidoId} – Obrigado pela compra!`, htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de confirmação de pedido:', error);
    throw error;
  }
};

// Status de entrega
export const sendDeliveryStatusEmail = async (deliveryData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('delivery-status');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const bodyContent = compiledTemplate({
      clienteNome: deliveryData.clienteNome,
      pedidoId: deliveryData.pedidoId,
      status: deliveryData.status,
      codigoRastreio: deliveryData.codigoRastreio,
      previsaoEntrega: deliveryData.previsaoEntrega,
      local: deliveryData.local,
      dataAtualizacao: deliveryData.dataAtualizacao,
      showTrackingButton: deliveryData.showTrackingButton,
      isDelivered: deliveryData.isDelivered,
      frontendUrl
    });

    const htmlContent = compiledBase({
      title: `Atualização no seu pedido #${deliveryData.pedidoId}`,
      body: bodyContent,
      showUnsubscribe: false
    });

    return await sendEmail(deliveryData.email, `Atualização no seu pedido #${deliveryData.pedidoId}`, htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de status de entrega:', error);
    throw error;
  }
};

// === FUNÇÕES DE EMAIL PARA VENDEDORES ===

// Nova venda
export const sendVendorNewSaleEmail = async (saleData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('vendor-new-sale');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const bodyContent = compiledTemplate({
      vendedorNome: saleData.vendedorNome,
      pedidoId: saleData.pedidoId,
      dataPedido: saleData.dataPedido,
      produtos: saleData.produtos,
      valorTotal: saleData.valorTotal,
      frontendUrl
    });

    const htmlContent = compiledBase({
      title: 'Nova venda recebida!',
      body: bodyContent,
      showUnsubscribe: false
    });

    return await sendEmail(saleData.email, `Nova venda! Pedido #${saleData.pedidoId} processado.`, htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de nova venda:', error);
    throw error;
  }
};

// Estoque baixo
export const sendVendorLowStockEmail = async (stockData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('vendor-low-stock');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const bodyContent = compiledTemplate({
      vendedorNome: stockData.vendedorNome,
      produtoNome: stockData.produtoNome,
      estoqueAtual: stockData.estoqueAtual,
      vendasRecentes: stockData.vendasRecentes,
      frontendUrl
    });

    const htmlContent = compiledBase({
      title: 'Alerta: Estoque baixo',
      body: bodyContent,
      showUnsubscribe: false
    });

    return await sendEmail(stockData.email, `Alerta: Estoque baixo no produto ${stockData.produtoNome}`, htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de estoque baixo:', error);
    throw error;
  }
};

// === LEGACY FUNCTIONS ===

// Função para enviar email de reset de senha
export const enviarEmailResetSenha = async (email, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetPageUrl = `${frontendUrl}/esqueci-senha`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">Redefinição de Senha</h2>
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir sua senha no HelpNet.</p>
      <p>Para redefinir sua senha, acesse a página de redefinição e use o token abaixo:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetPageUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Ir para Redefinição de Senha</a>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="color: #1e293b; margin-top: 0;">Seu Token de Reset:</h3>
        <p style="font-size: 18px; font-weight: bold; color: #2563eb; word-break: break-all;">${resetToken}</p>
        <p style="color: #64748b; margin-bottom: 0;"><strong>Informações importantes:</strong></p>
        <ul style="color: #64748b;">
          <li>Este token é válido por 1 hora</li>
          <li>Use-o na página de redefinição de senha</li>
          <li>Após expirar, solicite um novo token</li>
        </ul>
      </div>
      <p>Se você não solicitou esta redefinição, ignore este email.</p>
      <p>Atenciosamente,<br>Equipe HelpNet</p>
    </div>
  `;

  return await sendEmail(email, 'Redefinição de Senha - HelpNet', htmlContent);
};

// Função para enviar notificação de nova avaliação
export const enviarNotificacaoAvaliacao = async (vendedorEmail, vendedorNome, produtoNome, clienteNome, nota, comentario) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Nova Avaliação Recebida</h2>
        <p>Olá ${vendedorNome},</p>
        <p>Você recebeu uma nova avaliação para o produto <strong>${produtoNome}</strong>.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Detalhes da Avaliação</h3>
          <p><strong>Cliente:</strong> ${clienteNome}</p>
          <p><strong>Nota:</strong> ${nota}/5 ⭐</p>
          ${comentario ? `<p><strong>Comentário:</strong> ${comentario}</p>` : ''}
        </div>
        
        <p>Acesse sua área de vendedor para ver todas as avaliações dos seus produtos.</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${frontendUrl}/vendedor" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Acessar Painel do Vendedor</a>
        </div>
        
        <p>Atenciosamente,<br>Equipe HelpNet</p>
      </div>
    `;

    return await sendEmail(vendedorEmail, `Nova avaliação: ${produtoNome}`, htmlContent);
  } catch (error) {
    console.error('Erro ao enviar notificação de avaliação:', error);
    throw error;
  }
};

export default {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendDeliveryStatusEmail,
  sendVendorNewSaleEmail,
  sendVendorLowStockEmail,
  enviarEmailResetSenha,
  enviarNotificacaoAvaliacao
};