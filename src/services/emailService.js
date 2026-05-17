'use strict';

const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function getFrom() {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@lince.app';
  const fromName = process.env.RESEND_FROM_NAME || 'LINCE';
  return `${fromName} <${fromEmail}>`;
}

function getReplyTo() {
  return process.env.RESEND_REPLY_TO || 'linceresultados@gmail.com';
}

/**
 * Email Service using Resend
 * Handles sending emails with attachments (reports, password resets, subscription lifecycle)
 */
const emailService = {
  async sendReportEmail(options) {
    const {
      to,
      subject,
      html,
      text,
      attachments = [],
      cc = [],
      bcc = []
    } = options;

    if (!resend) {
      throw new Error('Resend API key not configured');
    }

    const msg = {
      from: getFrom(),
      to: Array.isArray(to) ? to : [to],
      subject,
      text: text || this.stripHtml(html),
      html,
      attachments: attachments.map(att => ({
        content: att.content,
        filename: att.filename
      })),
      replyTo: getReplyTo()
    };

    if (cc && cc.length > 0) msg.cc = cc;
    if (bcc && bcc.length > 0) msg.bcc = bcc;

    try {
      const { data, error } = await resend.emails.send(msg);
      if (error) throw error;
      console.log(`Email sent successfully to ${to}`);
      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Resend Error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  async sendReportWithPdf(options) {
    const {
      to,
      reportName,
      clientName,
      period,
      pdfBuffer,
      language = 'pt',
      cc = [],
      bcc = []
    } = options;

    const translations = {
      pt: {
        subject: `Relatório: ${reportName}`,
        greeting: 'Olá',
        intro: 'Segue em anexo o relatório solicitado.',
        reportDetails: 'Detalhes do Relatório:',
        client: 'Cliente',
        period: 'Período',
        reportName: 'Nome do Relatório',
        footer: 'Este é um e-mail automático. Por favor, não responda.',
        thanks: 'Obrigado',
        team: 'Equipe LINCE'
      },
      en: {
        subject: `Report: ${reportName}`,
        greeting: 'Hello',
        intro: 'Please find attached the requested report.',
        reportDetails: 'Report Details:',
        client: 'Client',
        period: 'Period',
        reportName: 'Report Name',
        footer: 'This is an automated email. Please do not reply.',
        thanks: 'Thank you',
        team: 'LINCE Team'
      }
    };

    const t = translations[language] || translations.pt;

    const html = buildReportHtml(t, clientName, reportName, period);

    await this.sendReportEmail({
      to,
      subject: t.subject,
      html,
      attachments: [{
        content: pdfBuffer,
        filename: `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      }],
      cc,
      bcc
    });
  },

  async sendReportWithWord(options) {
    const {
      to,
      reportName,
      clientName,
      period,
      docBuffer,
      language = 'pt',
      cc = [],
      bcc = []
    } = options;

    const translations = {
      pt: {
        subject: `Relatório: ${reportName}`,
        greeting: 'Olá',
        intro: 'Segue em anexo o relatório solicitado em formato Word.',
        reportDetails: 'Detalhes do Relatório:',
        client: 'Cliente',
        period: 'Período',
        reportName: 'Nome do Relatório',
        footer: 'Este é um e-mail automático. Por favor, não responda.',
        thanks: 'Obrigado',
        team: 'Equipe LINCE'
      },
      en: {
        subject: `Report: ${reportName}`,
        greeting: 'Hello',
        intro: 'Please find attached the requested report in Word format.',
        reportDetails: 'Report Details:',
        client: 'Client',
        period: 'Period',
        reportName: 'Report Name',
        footer: 'This is an automated email. Please do not reply.',
        thanks: 'Thank you',
        team: 'LINCE Team'
      }
    };

    const t = translations[language] || translations.pt;

    const html = buildReportHtml(t, clientName, reportName, period);

    await this.sendReportEmail({
      to,
      subject: t.subject,
      html,
      attachments: [{
        content: docBuffer,
        filename: `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`
      }],
      cc,
      bcc
    });
  },

  stripHtml(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  async sendPasswordResetEmail({ to, name, resetUrl }) {
    if (!resend) {
      throw new Error('Resend API key not configured');
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#3b82f6,#1e40af);padding:24px 32px;">
      <h1 style="color:white;margin:0;font-size:22px;letter-spacing:2px;">LINCE</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1e293b;margin:0 0 16px 0;font-size:18px;">Redefinicao de Senha</h2>
      <p style="color:#475569;margin:0 0 8px 0;">Ola, <strong>${name}</strong>.</p>
      <p style="color:#475569;margin:0 0 24px 0;">Recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo para criar uma nova senha. <strong>Este link expira em 1 hora.</strong></p>
      <a href="${resetUrl}" style="display:inline-block;background:#3b82f6;color:white;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;font-size:15px;margin-bottom:24px;">Redefinir Senha</a>
      <p style="color:#94a3b8;font-size:13px;margin:0;">Se voce nao solicitou a redefinicao de senha, ignore este e-mail. Sua senha nao sera alterada.</p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="color:#cbd5e1;font-size:12px;margin:0;">LINCE - Plataforma de Monitoramento de Tratamento de Agua</p>
    </div>
  </div>
</body></html>`;

    const { error } = await resend.emails.send({
      from: getFrom(),
      to: [to],
      replyTo: getReplyTo(),
      subject: 'Redefinicao de senha - LINCE',
      text: `Ola ${name},\n\nRedefina sua senha acessando o link abaixo (expira em 1 hora):\n${resetUrl}\n\nSe voce nao solicitou isso, ignore este e-mail.\n\nLINCE`,
      html
    });
    if (error) throw error;
    console.log('Password reset email sent to', to);
  },

  async sendSubscriptionEmail({ to, type, clientName, plan, accessUntil }) {
    if (!this.isConfigured()) {
      console.warn(`[EmailService] Resend not configured — skipping subscription email (type: ${type})`);
      return;
    }

    const templates = {
      activated: {
        subject: `Assinatura ativada — Plano ${plan}`,
        title: 'Assinatura Ativada!',
        color: '#10b981',
        body: `Sua assinatura do Plano <strong>${plan}</strong> foi ativada com sucesso. Você agora tem acesso completo à plataforma LINCE.`
      },
      payment_failed: {
        subject: 'Falha no pagamento — LINCE',
        title: 'Falha no Pagamento',
        color: '#f59e0b',
        body: `Não foi possível processar o pagamento do seu Plano <strong>${plan}</strong>. Tentaremos novamente nos próximos dias. Por favor, verifique os dados do seu cartão para evitar a suspensão do acesso.`
      },
      cancelled: {
        subject: 'Assinatura cancelada — LINCE',
        title: 'Assinatura Cancelada',
        color: '#ef4444',
        body: `Sua assinatura do Plano <strong>${plan}</strong> foi cancelada. Você ainda terá acesso à plataforma até <strong>${accessUntil || 'o fim do período atual'}</strong>.`
      },
      trial_ending: {
        subject: 'Seu período de teste está acabando — LINCE',
        title: 'Período de Teste Encerrando',
        color: '#3b82f6',
        body: `Seu período de teste gratuito encerrará em breve. Para continuar usando a plataforma LINCE sem interrupções, assine um dos nossos planos.`
      }
    };

    const tpl = templates[type];
    if (!tpl) return;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:${tpl.color};padding:24px 32px;">
      <h1 style="color:white;margin:0;font-size:20px;letter-spacing:1px;">LINCE</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1e293b;margin:0 0 16px 0;font-size:18px;">${tpl.title}</h2>
      <p style="color:#475569;margin:0 0 8px 0;">Olá, <strong>${clientName}</strong>.</p>
      <p style="color:#475569;margin:0 0 24px 0;">${tpl.body}</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing"
         style="display:inline-block;background:${tpl.color};color:white;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;">
        Gerenciar Assinatura
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">LINCE — Plataforma de Monitoramento de Tratamento de Água</p>
    </div>
  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: getFrom(),
      to: [to],
      replyTo: getReplyTo(),
      subject: tpl.subject,
      html,
      text: `${tpl.title}\n\n${tpl.body.replace(/<[^>]+>/g, '')}\n\nAcesse: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing`
    });
    if (error) throw error;
  },


  async sendVerificationEmail({ to, name, verifyUrl }) {
    if (!resend) throw new Error('Resend API key not configured');

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#3b82f6,#1e40af);padding:24px 32px;">
      <h1 style="color:white;margin:0;font-size:22px;letter-spacing:2px;">LINCE</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1e293b;margin:0 0 16px 0;font-size:18px;">Confirme seu e-mail</h2>
      <p style="color:#475569;margin:0 0 8px 0;">Olá, <strong>${name}</strong>.</p>
      <p style="color:#475569;margin:0 0 24px 0;">Clique no botão abaixo para ativar sua conta LINCE. <strong>Este link expira em 24 horas.</strong></p>
      <a href="${verifyUrl}" style="display:inline-block;background:#3b82f6;color:white;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;font-size:15px;margin-bottom:24px;">Confirmar E-mail</a>
      <p style="color:#94a3b8;font-size:13px;margin:0;">Se você não criou esta conta, ignore este e-mail.</p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="color:#cbd5e1;font-size:12px;margin:0;">LINCE - Plataforma de Monitoramento de Tratamento de Água</p>
    </div>
  </div>
</body></html>`;

    const { error } = await resend.emails.send({
      from: getFrom(),
      to: [to],
      replyTo: getReplyTo(),
      subject: 'Confirme seu e-mail - LINCE',
      html,
      text: `Olá ${name},\n\nConfirme seu e-mail acessando o link abaixo (expira em 24h):\n${verifyUrl}\n\nLINCE`
    });
    if (error) throw error;
    console.log('Verification email sent to', to);
  },

  isConfigured() {
    return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  }
};

function buildReportHtml(t, clientName, reportName, period) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #1976d2; }
        .details-row { margin: 10px 0; }
        .label { font-weight: bold; color: #1976d2; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">LINCE</h1>
        <p style="margin: 5px 0 0 0;">Sistema de Gestão de Tratamento de Água</p>
      </div>
      <div class="content">
        <p>${t.greeting},</p>
        <p>${t.intro}</p>
        <div class="details">
          <h3 style="margin-top: 0;">${t.reportDetails}</h3>
          ${clientName ? `<div class="details-row"><span class="label">${t.client}:</span> ${clientName}</div>` : ''}
          <div class="details-row"><span class="label">${t.reportName}:</span> ${reportName}</div>
          <div class="details-row"><span class="label">${t.period}:</span> ${period}</div>
        </div>
        <p>${t.thanks},<br>${t.team}</p>
      </div>
      <div class="footer">
        <p>${t.footer}</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = emailService;
