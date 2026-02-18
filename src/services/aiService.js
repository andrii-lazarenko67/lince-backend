'use strict';

const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * AI Service using Claude API
 * Provides intelligent assistance for water treatment system management
 */
const aiService = {
  /**
   * System context for AI assistant
   */
  SYSTEM_CONTEXT: `You are LINCE AI Assistant, an expert in water treatment systems, pool maintenance, and water quality management.

Your role is to help users:
- Understand and use the LINCE water treatment management system
- Configure systems (pools, water treatment plants, water distribution stations)
- Interpret water quality analysis results
- Respond to alerts and anomalies
- Maintain compliance with water quality standards
- Troubleshoot issues

Key concepts:
- SYSTEMS: Water treatment facilities (pools, WWTPs, water stations)
- MONITORING POINTS: Specific parameters measured (pH, chlorine, turbidity, etc.)
- DAILY LOGS: Regular water quality measurements
- INSPECTIONS: Routine facility checks
- INCIDENTS: Problems or anomalies requiring attention
- ALERTS: Out-of-range measurements requiring action

Communication style:
- Be helpful, clear, and concise
- Use simple language (users may not be technical)
- Provide actionable recommendations
- Reference Brazilian water quality standards (CONAMA, Portaria 2914) when relevant
- Support both Portuguese and English
- Be encouraging and supportive`,

  /**
   * Send a chat message to AI assistant
   * @param {Object} params
   * @param {string} params.message - User message
   * @param {Array} params.conversationHistory - Previous messages
   * @param {Object} params.context - Current page/system context
   * @param {string} params.language - User language (pt or en)
   * @returns {Promise<Object>} AI response
   */
  async chat({ message, conversationHistory = [], context = {}, language = 'pt' }) {
    try {
      // Build context message
      let contextMessage = '';
      if (context.page) {
        contextMessage += `\nUser is currently on: ${context.page}`;
      }
      if (context.systemType) {
        contextMessage += `\nCurrent system type: ${context.systemType}`;
      }
      if (context.data) {
        contextMessage += `\nCurrent data: ${JSON.stringify(context.data, null, 2)}`;
      }
      if (language) {
        contextMessage += `\nUser language: ${language} (respond in this language)`;
      }

      // Build messages array
      const messages = [];

      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current message with context
      const currentMessage = contextMessage
        ? `${contextMessage}\n\nUser question: ${message}`
        : message;

      messages.push({
        role: 'user',
        content: currentMessage
      });

      // Call Claude API
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: this.SYSTEM_CONTEXT,
        messages: messages
      });

      return {
        success: true,
        message: response.content[0].text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`AI service error: ${error.message}`);
    }
  },

  /**
   * Analyze water quality data and provide recommendations
   * @param {Object} params
   * @param {Array} params.measurements - Recent measurements
   * @param {string} params.systemType - Type of system
   * @param {string} params.language - User language
   * @returns {Promise<Object>} Analysis and recommendations
   */
  async analyzeWaterQuality({ measurements, systemType, language = 'pt' }) {
    try {
      const prompt = language === 'pt'
        ? `Analise os seguintes dados de qualidade da água para um sistema do tipo ${systemType}:

${JSON.stringify(measurements, null, 2)}

Forneça:
1. Avaliação geral da qualidade da água
2. Parâmetros fora do padrão (se houver)
3. Recomendações de ação
4. Urgência (baixa/média/alta)

Seja conciso e prático.`
        : `Analyze the following water quality data for a ${systemType} system:

${JSON.stringify(measurements, null, 2)}

Provide:
1. Overall water quality assessment
2. Out-of-range parameters (if any)
3. Action recommendations
4. Urgency level (low/medium/high)

Be concise and practical.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: this.SYSTEM_CONTEXT,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        success: true,
        analysis: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error(`AI analysis error: ${error.message}`);
    }
  },

  /**
   * Get smart suggestions for system setup
   * @param {Object} params
   * @param {string} params.systemType - Type of system (pool, wwtp, etc)
   * @param {number} params.capacity - System capacity
   * @param {string} params.usage - Usage type
   * @param {string} params.language - User language
   * @returns {Promise<Object>} Setup suggestions
   */
  async getSetupSuggestions({ systemType, capacity, usage, language = 'pt' }) {
    try {
      const prompt = language === 'pt'
        ? `Sugira uma configuração padrão para um sistema de ${systemType} com:
- Capacidade: ${capacity}
- Uso: ${usage}

Forneça:
1. Parâmetros recomendados para monitoramento
2. Valores ideais e limites aceitáveis
3. Frequência de análise recomendada
4. Cuidados especiais

Retorne em formato JSON estruturado.`
        : `Suggest a standard configuration for a ${systemType} system with:
- Capacity: ${capacity}
- Usage: ${usage}

Provide:
1. Recommended monitoring parameters
2. Ideal values and acceptable limits
3. Recommended analysis frequency
4. Special care considerations

Return in structured JSON format.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        system: this.SYSTEM_CONTEXT,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        success: true,
        suggestions: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      console.error('AI Setup Suggestions Error:', error);
      throw new Error(`AI setup suggestions error: ${error.message}`);
    }
  },

  /**
   * Get contextual help for current page/feature
   * @param {Object} params
   * @param {string} params.page - Current page identifier
   * @param {string} params.feature - Specific feature
   * @param {string} params.language - User language
   * @returns {Promise<Object>} Contextual help
   */
  async getContextualHelp({ page, feature, language = 'pt' }) {
    try {
      const pageDescriptions = {
        'dashboard': language === 'pt' ? 'painel principal' : 'main dashboard',
        'systems': language === 'pt' ? 'gerenciamento de sistemas' : 'systems management',
        'monitoring-points': language === 'pt' ? 'pontos de monitoramento' : 'monitoring points',
        'daily-logs': language === 'pt' ? 'registros diários' : 'daily logs',
        'inspections': language === 'pt' ? 'inspeções' : 'inspections',
        'incidents': language === 'pt' ? 'incidentes' : 'incidents',
        'reports': language === 'pt' ? 'relatórios' : 'reports'
      };

      const pageDesc = pageDescriptions[page] || page;

      const prompt = language === 'pt'
        ? `O usuário está na página "${pageDesc}"${feature ? ` tentando usar: ${feature}` : ''}.

Forneça uma explicação breve (2-3 frases) sobre:
1. O que esta funcionalidade faz
2. Como usar
3. Dica útil

Seja direto e prático.`
        : `The user is on the "${pageDesc}" page${feature ? ` trying to use: ${feature}` : ''}.

Provide a brief explanation (2-3 sentences) about:
1. What this feature does
2. How to use it
3. Helpful tip

Be direct and practical.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 512,
        system: this.SYSTEM_CONTEXT,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        success: true,
        help: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      console.error('AI Contextual Help Error:', error);
      throw new Error(`AI contextual help error: ${error.message}`);
    }
  },

  /**
   * Get alert interpretation and recommendations
   * @param {Object} params
   * @param {Object} params.alert - Alert details
   * @param {string} params.systemType - System type
   * @param {string} params.language - User language
   * @returns {Promise<Object>} Alert interpretation
   */
  async interpretAlert({ alert, systemType, language = 'pt' }) {
    try {
      const prompt = language === 'pt'
        ? `Um alerta foi gerado no sistema ${systemType}:

Parâmetro: ${alert.parameter}
Valor medido: ${alert.value} ${alert.unit}
Limite: ${alert.limit} ${alert.unit}
Nível: ${alert.severity}

Explique:
1. Por que isso é um problema
2. Possíveis causas
3. Ações corretivas recomendadas
4. Urgência de resposta

Seja claro e prático.`
        : `An alert was generated in ${systemType} system:

Parameter: ${alert.parameter}
Measured value: ${alert.value} ${alert.unit}
Limit: ${alert.limit} ${alert.unit}
Severity: ${alert.severity}

Explain:
1. Why this is a problem
2. Possible causes
3. Recommended corrective actions
4. Response urgency

Be clear and practical.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: this.SYSTEM_CONTEXT,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        success: true,
        interpretation: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      console.error('AI Alert Interpretation Error:', error);
      throw new Error(`AI alert interpretation error: ${error.message}`);
    }
  },

  /**
   * Check if AI service is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!process.env.ANTHROPIC_API_KEY;
  }
};

module.exports = aiService;
