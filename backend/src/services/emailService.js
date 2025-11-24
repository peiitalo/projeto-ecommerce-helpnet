import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar CSS inline para emails
const inlineCSS = `
  *, ::before, ::after {
    --tw-border-spacing-x: 0;
    --tw-border-spacing-y: 0;
    --tw-translate-x: 0;
    --tw-translate-y: 0;
    --tw-rotate: 0;
    --tw-skew-x: 0;
    --tw-skew-y: 0;
    --tw-scale-x: 1;
    --tw-scale-y: 1;
    --tw-pan-x: ;
    --tw-pan-y: ;
    --tw-pinch-zoom: ;
    --tw-scroll-snap-strictness: proximity;
    --tw-gradient-from-position: ;
    --tw-gradient-via-position: ;
    --tw-gradient-to-position: ;
    --tw-ordinal: ;
    --tw-slashed-zero: ;
    --tw-numeric-figure: ;
    --tw-numeric-spacing: ;
    --tw-numeric-fraction: ;
    --tw-ring-inset: ;
    --tw-ring-offset-width: 0px;
    --tw-ring-offset-color: #fff;
    --tw-ring-color: rgb(59 130 246 / 0.5);
    --tw-ring-offset-shadow: 0 0 #0000;
    --tw-ring-shadow: 0 0 #0000;
    --tw-shadow: 0 0 #0000;
    --tw-shadow-colored: 0 0 #0000;
    --tw-blur: ;
    --tw-brightness: ;
    --tw-contrast: ;
    --tw-grayscale: ;
    --tw-hue-rotate: ;
    --tw-invert: ;
    --tw-saturate: ;
    --tw-sepia: ;
    --tw-drop-shadow: ;
    --tw-backdrop-blur: ;
    --tw-backdrop-brightness: ;
    --tw-backdrop-contrast: ;
    --tw-backdrop-grayscale: ;
    --tw-backdrop-hue-rotate: ;
    --tw-backdrop-invert: ;
    --tw-backdrop-opacity: ;
    --tw-backdrop-saturate: ;
    --tw-backdrop-sepia: ;
    --tw-contain-size: ;
    --tw-contain-layout: ;
    --tw-contain-paint: ;
    --tw-contain-style: ;
  }

  .collapse {
    visibility: collapse
  }

  .absolute {
    position: absolute
  }

  .relative {
    position: relative
  }

  .block {
    display: block
  }

  .inline-block {
    display: inline-block
  }

  .flex {
    display: flex
  }

  .table {
    display: table
  }

  .hidden {
    display: none
  }

  .flex-shrink {
    flex-shrink: 1
  }

  .border-collapse {
    border-collapse: collapse
  }

  .transform {
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))
  }

  .border {
    border-width: 1px
  }

  .uppercase {
    text-transform: uppercase
  }

  .italic {
    font-style: italic
  }

  .underline {
    text-decoration-line: underline
  }

  .antialiased {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale
  }

  .outline {
    outline-style: solid
  }

  .blur {
    --tw-blur: blur(8px);
    filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)
  }

  .grayscale {
    --tw-grayscale: grayscale(100%);
    filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)
  }

  .backdrop-filter {
    backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)
  }

  .transition {
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms
  }
`;

// Registrar helpers customizados do Handlebars
handlebars.registerHelper('range', function(n) {
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(i);
  }
  return result;
});

handlebars.registerHelper('gte', function(a, b) {
  return a >= b;
});

handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

handlebars.registerHelper('array', function() {
  return Array.prototype.slice.call(arguments, 0, arguments.length - 1);
});

// Registrar partials
handlebars.registerPartial('statusBar', fs.readFileSync(path.join(__dirname, '../templates/emails/partials/status-bar.hbs'), 'utf8'));
handlebars.registerPartial('productItem', fs.readFileSync(path.join(__dirname, '../templates/emails/partials/product-item.hbs'), 'utf8'));

handlebars.registerHelper('formatDate', function(date, format) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
});

handlebars.registerHelper('now', function() {
  return new Date();
});

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
    let baseTemplate = fs.readFileSync(baseTemplatePath, 'utf8');

    // Injetar CSS inline no template base
    baseTemplate = baseTemplate.replace('</style>', `${inlineCSS}\n    </style>`);

    const compiledTemplate = handlebars.compile(templateContent);
    const compiledBase = handlebars.compile(baseTemplate);

    return { compiledTemplate, compiledBase };
  } catch (error) {
    console.error(`Erro ao carregar template ${templateName}:`, error);
    throw error;
  }
};

// Modo preview global
let previewMode = false;
let previewCallback = null;

// Função para ativar modo preview
export const setPreviewMode = (callback) => {
  previewMode = true;
  previewCallback = callback;
};

// Função auxiliar para enviar email
const sendEmail = async (to, subject, htmlContent) => {
  // Se estiver em modo preview, retornar HTML em vez de enviar
  if (previewMode && previewCallback) {
    previewCallback(to, subject, htmlContent);
    return { success: true, messageId: 'preview-mode', provider: 'preview' };
  }

  console.log('=== INICIANDO ENVIO DE EMAIL ===');
  console.log('Para:', to);
  console.log('Assunto:', subject);
  console.log('Conteúdo HTML length:', htmlContent.length);

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

    // Verificar configurações disponíveis
    console.log('=== VERIFICANDO CONFIGURAÇÕES ===');
    console.log('SENDGRID_API_KEY configurado:', !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key'));
    console.log('SMTP_HOST configurado:', !!process.env.SMTP_HOST);
    console.log('SMTP_USER configurado:', !!(process.env.SMTP_USER && process.env.SMTP_USER !== 'your-email@gmail.com'));
    console.log('ETHEREAL_USER configurado:', !!(process.env.ETHEREAL_USER && process.env.ETHEREAL_USER !== 'your-ethereal-user'));
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('==================================');

    // Tentar SendGrid primeiro
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key') {
      console.log('Tentando enviar via SendGrid...');
      try {
        const result = await sgMail.send(mailOptions);
        console.log('✅ Email enviado com sucesso via SendGrid:', result[0]?.headers?.['x-message-id']);
        return { success: true, messageId: result[0]?.headers?.['x-message-id'], provider: 'sendgrid' };
      } catch (sendgridError) {
        console.error('❌ Erro ao enviar via SendGrid:', sendgridError.message);
        console.log('Continuando para próximos provedores...');
      }
    } else {
      console.log('SendGrid não configurado ou chave padrão detectada, pulando...');
    }

    // Tentar SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_USER !== 'your-email@gmail.com') {
      console.log('Tentando enviar via SMTP...');
      try {
        const info = await smtpTransporter.sendMail({
          ...mailOptions,
          from: `"HelpNet" <${process.env.SMTP_USER}>`
        });
        console.log('✅ Email enviado com sucesso via SMTP:', info.messageId);
        return { success: true, messageId: info.messageId, provider: 'smtp' };
      } catch (smtpError) {
        console.error('❌ Erro ao enviar via SMTP:', smtpError.message);
        console.log('Continuando para próximos provedores...');
      }
    } else {
      console.log('SMTP não configurado ou usuário padrão detectado, pulando...');
    }

    // Fallback para Ethereal
    if (process.env.ETHEREAL_USER && process.env.ETHEREAL_USER !== 'your-ethereal-user') {
      console.log('Tentando enviar via Ethereal...');
      try {
        const info = await etherealTransporter.sendMail({
          ...mailOptions,
          from: '"HelpNet" <noreply@helpnet.com>'
        });
        console.log('✅ Email enviado com sucesso via Ethereal:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        return { success: true, messageId: info.messageId, provider: 'ethereal' };
      } catch (etherealError) {
        console.error('❌ Erro ao enviar via Ethereal:', etherealError.message);
        console.log('Continuando para modo desenvolvimento...');
      }
    } else {
      console.log('Ethereal não configurado ou usuário padrão detectado, pulando...');
    }

    // Desenvolvimento: apenas logar
    console.log('=== EMAIL (MODO DESENVOLVIMENTO) ===');
    console.log('Para:', to);
    console.log('Assunto:', subject);
    console.log('Conteúdo HTML length:', htmlContent.length);
    console.log('Configure SENDGRID_API_KEY, SMTP_* ou ETHEREAL_* para enviar emails reais.');
    console.log('=====================================');
    return { success: true, messageId: 'development-mode', provider: 'development' };

  } catch (error) {
    console.error('❌ ERRO GERAL ao enviar email:', error);
    console.error('Stack trace:', error.stack);
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

// Função para enviar email de pedido pago
export const sendOrderPaidEmail = async (orderData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('order-paid');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const bodyContent = compiledTemplate({
      clienteNome: orderData.clienteNome,
      pedidoId: orderData.pedidoId,
      dataPagamento: orderData.dataPagamento,
      metodoPagamento: orderData.metodoPagamento,
      produtos: orderData.produtos,
      total: orderData.total,
      frontendUrl
    });

    const htmlContent = compiledBase({
      title: `Pagamento Aprovado - Pedido #${orderData.pedidoId}`,
      body: bodyContent,
      showUnsubscribe: false
    });

    return await sendEmail(orderData.email, `Pagamento Aprovado - Pedido #${orderData.pedidoId}`, htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de pagamento aprovado:', error);
    throw error;
  }
};

// Função para enviar email de pedido enviado
export const sendOrderShippedEmail = async (orderData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('order-shipped');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const bodyContent = compiledTemplate({
      clienteNome: orderData.clienteNome,
      pedidoId: orderData.pedidoId,
      dataEnvio: orderData.dataEnvio,
      codigoRastreio: orderData.codigoRastreio,
      transportadora: orderData.transportadora,
      previsaoEntrega: orderData.previsaoEntrega,
      statusAtual: orderData.statusAtual,
      produtos: orderData.produtos,
      enderecoEntrega: orderData.enderecoEntrega,
      total: orderData.total,
      frontendUrl
    });

    const htmlContent = compiledBase({
      title: `Pedido Enviado - Pedido #${orderData.pedidoId}`,
      body: bodyContent,
      showUnsubscribe: false
    });

    return await sendEmail(orderData.email, `Seu pedido #${orderData.pedidoId} foi enviado`, htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de pedido enviado:', error);
    throw error;
  }
};

// Função para enviar email de pedido entregue
export const sendOrderDeliveredEmail = async (orderData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('order-delivered');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const bodyContent = compiledTemplate({
      clienteNome: orderData.clienteNome,
      pedidoId: orderData.pedidoId,
      dataEntrega: orderData.dataEntrega,
      recebidoPor: orderData.recebidoPor,
      produtos: orderData.produtos,
      total: orderData.total,
      frontendUrl
    });

    const htmlContent = compiledBase({
      title: `Pedido Entregue - Pedido #${orderData.pedidoId}`,
      body: bodyContent,
      showUnsubscribe: false
    });

    return await sendEmail(orderData.email, `Seu pedido #${orderData.pedidoId} foi entregue`, htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de pedido entregue:', error);
    throw error;
  }
};

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

// === FUNÇÕES PARA NOVOS TEMPLATES REDESENHADOS ===

// Email de suporte (interno - para equipe)
export const sendContactSupportEmail = async (contactData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('contato-suporte');
    
    const bodyContent = compiledTemplate({
      nome: contactData.nome,
      email: contactData.email,
      telefone: contactData.telefone,
      assunto: contactData.assunto,
      mensagem: contactData.mensagem
    });

    const htmlContent = compiledBase({
      title: 'Nova Mensagem de Contato Recebida',
      body: bodyContent,
      showUnsubscribe: false
    });

    // Email interno para a equipe de suporte
    const supportEmail = process.env.SUPPORT_EMAIL || 'suporte@helpnet.com';
    return await sendEmail(supportEmail, `Nova Mensagem de Contato: ${contactData.assunto}`, htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de suporte:', error);
    throw error;
  }
};

// Email de confirmação de contato (para cliente)
export const sendContactConfirmationEmail = async (contactData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('contato-confirmacao');
    
    const bodyContent = compiledTemplate({
      nome: contactData.nome,
      assunto: contactData.assunto
    });

    const htmlContent = compiledBase({
      title: 'Recebemos sua mensagem!',
      body: bodyContent,
      showUnsubscribe: false
    });

    return await sendEmail(contactData.email, 'Recebemos sua mensagem! - HelpNet', htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de confirmação de contato:', error);
    throw error;
  }
};

// Email de confirmação de avaliação recebida (para cliente)
export const sendReviewReceivedEmail = async (reviewData) => {
  try {
    const { compiledTemplate, compiledBase } = loadTemplate('avaliacao-recebida');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const bodyContent = compiledTemplate({
      nome: reviewData.nome,
      estrelas: reviewData.estrelas,
      comentario: reviewData.comentario,
      frontendUrl
    });

    const htmlContent = compiledBase({
      title: 'Obrigado pela sua avaliação!',
      body: bodyContent,
      showUnsubscribe: false
    });

    return await sendEmail(reviewData.email, 'Obrigado pela sua avaliação! - HelpNet', htmlContent);
  } catch (error) {
    console.error('Erro ao enviar email de confirmação de avaliação:', error);
    throw error;
  }
};

export default {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderPaidEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendDeliveryStatusEmail,
  sendVendorNewSaleEmail,
  sendVendorLowStockEmail,
  enviarEmailResetSenha,
  enviarNotificacaoAvaliacao,
  sendContactSupportEmail,
  sendContactConfirmationEmail,
  sendReviewReceivedEmail
};