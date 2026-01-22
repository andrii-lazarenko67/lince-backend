'use strict';

const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key from environment
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Email Service using SendGrid
 * Handles sending emails with attachments (reports)
 */
const emailService = {
  /**
   * Send report via email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @param {string} options.text - Email plain text content (optional)
   * @param {Array} options.attachments - Array of attachments
   * @param {string} options.attachments[].content - Base64 encoded file content
   * @param {string} options.attachments[].filename - File name
   * @param {string} options.attachments[].type - MIME type
   * @param {string} options.attachments[].disposition - 'attachment' or 'inline'
   * @returns {Promise<void>}
   */
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

    // Use configured sender email or default
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@lince.app';
    const fromName = process.env.SENDGRID_FROM_NAME || 'LINCE Reports';

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject,
      text: text || this.stripHtml(html),
      html,
      attachments: attachments.map(att => ({
        content: att.content,
        filename: att.filename,
        type: att.type || 'application/pdf',
        disposition: att.disposition || 'attachment'
      }))
    };

    // Add CC if provided
    if (cc && cc.length > 0) {
      msg.cc = cc;
    }

    // Add BCC if provided
    if (bcc && bcc.length > 0) {
      msg.bcc = bcc;
    }

    try {
      await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('SendGrid Error:', error);
      if (error.response) {
        console.error('SendGrid Response Error:', error.response.body);
      }
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  /**
   * Send report with PDF attachment
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.reportName - Report name
   * @param {string} options.clientName - Client name
   * @param {string} options.period - Period description
   * @param {Buffer} options.pdfBuffer - PDF file buffer
   * @param {string} options.language - Language code ('en' or 'pt')
   * @returns {Promise<void>}
   */
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

    // Translate email content based on language
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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #1976d2;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
          }
          .details {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #1976d2;
          }
          .details-row {
            margin: 10px 0;
          }
          .label {
            font-weight: bold;
            color: #1976d2;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 5px 5px;
          }
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

    // Convert PDF buffer to base64
    const pdfBase64 = pdfBuffer.toString('base64');

    await this.sendReportEmail({
      to,
      subject: t.subject,
      html,
      attachments: [{
        content: pdfBase64,
        filename: `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      }],
      cc,
      bcc
    });
  },

  /**
   * Send report with Word document attachment
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.reportName - Report name
   * @param {string} options.clientName - Client name
   * @param {string} options.period - Period description
   * @param {Buffer} options.docBuffer - Word document buffer
   * @param {string} options.language - Language code ('en' or 'pt')
   * @returns {Promise<void>}
   */
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

    // Translate email content based on language
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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #1976d2;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
          }
          .details {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #1976d2;
          }
          .details-row {
            margin: 10px 0;
          }
          .label {
            font-weight: bold;
            color: #1976d2;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 5px 5px;
          }
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

    // Convert Word buffer to base64
    const docBase64 = docBuffer.toString('base64');

    await this.sendReportEmail({
      to,
      subject: t.subject,
      html,
      attachments: [{
        content: docBase64,
        filename: `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        disposition: 'attachment'
      }],
      cc,
      bcc
    });
  },

  /**
   * Strip HTML tags from string (for plain text fallback)
   * @param {string} html - HTML string
   * @returns {string} Plain text
   */
  stripHtml(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Verify SendGrid configuration
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
  }
};

module.exports = emailService;
