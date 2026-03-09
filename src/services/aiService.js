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
   * Get system context in specified language
   * @param {string} language - User language (pt or en)
   * @returns {string} System context
   */
  getSystemContext(language = 'pt') {
    if (language === 'pt') {
      return `Você é o Assistente IA LINCE, um especialista em sistemas de tratamento de água, manutenção de piscinas e gestão de qualidade da água.

Seu papel é ajudar os usuários a:
- Entender e usar o sistema de gestão de tratamento de água LINCE
- Configurar sistemas (piscinas, estações de tratamento de água, estações de distribuição)
- Interpretar resultados de análises de qualidade da água
- Responder a alertas e anomalias
- Manter conformidade com padrões de qualidade da água
- Solucionar problemas

Conceitos-chave:
- SISTEMAS: Instalações de tratamento de água (piscinas, ETAs, estações)
- PONTOS DE MONITORAMENTO: Parâmetros específicos medidos (pH, cloro, turbidez, etc.)
- REGISTROS DIÁRIOS: Medições regulares de qualidade da água
- INSPEÇÕES: Verificações rotineiras das instalações
- INCIDENTES: Problemas ou anomalias que requerem atenção
- ALERTAS: Medições fora dos limites que exigem ação

Estilo de comunicação:
- Seja prestativo, claro e conciso
- Use linguagem simples (usuários podem não ser técnicos)
- Forneça recomendações acionáveis
- Referencie normas brasileiras de qualidade da água (CONAMA, Portaria 2914) quando relevante
- Sempre responda em português brasileiro
- Seja encorajador e solidário`;
    } else {
      return `You are LINCE AI Assistant, an expert in water treatment systems, pool maintenance, and water quality management.

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
- Reference water quality standards (CONAMA, Portaria 2914) when relevant
- Always respond in English
- Be encouraging and supportive`;
    }
  },

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
        const pageLabel = language === 'pt' ? 'Usuário está atualmente em' : 'User is currently on';
        contextMessage += `\n${pageLabel}: ${context.page}`;
      }
      if (context.systemType) {
        const typeLabel = language === 'pt' ? 'Tipo de sistema atual' : 'Current system type';
        contextMessage += `\n${typeLabel}: ${context.systemType}`;
      }
      if (context.data) {
        const dataLabel = language === 'pt' ? 'Dados atuais' : 'Current data';
        contextMessage += `\n${dataLabel}: ${JSON.stringify(context.data, null, 2)}`;
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
      const questionLabel = language === 'pt' ? 'Pergunta do usuário' : 'User question';
      const currentMessage = contextMessage
        ? `${contextMessage}\n\n${questionLabel}: ${message}`
        : message;

      messages.push({
        role: 'user',
        content: currentMessage
      });

      // Call Claude API with language-specific system context
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: this.getSystemContext(language),
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: this.getSystemContext(language),
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: this.getSystemContext(language),
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: this.getSystemContext(language),
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: this.getSystemContext(language),
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
   * Extract lab report values from an uploaded image or PDF
   */
  async extractLabReport({ fileBuffer, mimeType, monitoringPoints, language = 'pt' }) {
    const mpList = monitoringPoints.map((mp, i) =>
      `${i + 1}. ID:${mp.id} | Parâmetro: ${mp.parameterName || mp.name} | Unidade: ${mp.unit || 'N/A'}`
    ).join('\n');

    const prompt = language === 'pt'
      ? `Você é um especialista em análise de relatórios laboratoriais de qualidade da água.\n\nAnalise este relatório e extraia os valores numéricos medidos para os seguintes pontos de monitoramento:\n\n${mpList}\n\nRegras:\n- Retorne SOMENTE um JSON válido, sem texto adicional\n- Use o ID do ponto de monitoramento como chave\n- Inclua apenas parâmetros encontrados no relatório\n- Os valores devem ser numéricos\n\nFormato: {"values":{"ID":VALOR},"found":["nomes encontrados"],"notFound":["nomes não encontrados"]}`
      : `You are an expert in analyzing water quality laboratory reports.\n\nAnalyze this report and extract the numeric measurement values for the following monitoring points:\n\n${mpList}\n\nRules:\n- Return ONLY valid JSON, no additional text\n- Use the monitoring point ID as the key\n- Include only parameters found in the report\n- Values must be numeric\n\nFormat: {"values":{"ID":VALUE},"found":["found names"],"notFound":["not found names"]}`;

    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';
    const base64 = fileBuffer.toString('base64');

    let content;
    let model;

    if (isImage) {
      model = 'claude-haiku-4-5-20251001';
      content = [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
        { type: 'text', text: prompt }
      ];
    } else if (isPdf) {
      model = 'claude-haiku-4-5-20251001';
      content = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: prompt }
      ];
    } else {
      throw new Error('Unsupported file type. Use images (PNG, JPG, WEBP) or PDF.');
    }

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content }]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response as JSON');

    return JSON.parse(jsonMatch[0]);
  },

  /**
   * Generate an advanced custom AI report based on a free-form prompt and real monitoring data
   * @param {Object} params
   * @param {string} params.prompt - User's custom prompt / instruction
   * @param {Object} params.reportContext - Full monitoring data context
   * @param {string} params.language - 'pt' or 'en'
   */
  async generateAdvancedReport({ prompt, reportContext, language = 'pt' }) {
    const {
      clientName,
      systems,
      period,
      dailyLogsData,
      inspectionsData,
      incidentsData,
      summary
    } = reportContext;

    // Build detailed monitoring readings section
    const buildReadingsSection = () => {
      if (!dailyLogsData || dailyLogsData.length === 0) {
        return language === 'pt' ? 'Nenhum registro encontrado para o período.' : 'No records found for this period.';
      }

      return dailyLogsData.map(log => {
        const dateStr = log.date;
        const type = log.recordType === 'laboratory'
          ? (language === 'pt' ? 'Análise Laboratorial' : 'Laboratory Analysis')
          : (language === 'pt' ? 'Medição em Campo' : 'Field Measurement');
        const systemName = log.systemName || '';
        const labName = log.laboratory ? ` | ${language === 'pt' ? 'Laboratório' : 'Lab'}: ${log.laboratory}` : '';
        const period = log.period ? ` | ${language === 'pt' ? 'Período' : 'Period'}: ${log.period}` : '';

        const entries = (log.entries || []).map(entry => {
          const status = entry.isOutOfRange
            ? (language === 'pt' ? '⚠ FORA DA ESPECIFICAÇÃO' : '⚠ OUT OF SPEC')
            : (language === 'pt' ? '✓ DENTRO DA ESPECIFICAÇÃO' : '✓ WITHIN SPEC');
          const range = (entry.minValue !== null && entry.maxValue !== null)
            ? `[${language === 'pt' ? 'Especif' : 'Spec'}: ${entry.minValue} – ${entry.maxValue} ${entry.unit}]`
            : '';
          const notes = entry.notes ? ` | ${language === 'pt' ? 'Obs' : 'Notes'}: "${entry.notes}"` : '';
          return `    • ${entry.parameter} (${entry.systemName || systemName}): ${entry.value} ${entry.unit} ${range} ${status}${notes}`;
        }).join('\n');

        return `[${dateStr}] ${type} – ${systemName}${period}${labName}\n${entries || (language === 'pt' ? '    (sem leituras)' : '    (no readings)')}`;
      }).join('\n\n');
    };

    const buildInspectionsSection = () => {
      if (!inspectionsData || inspectionsData.length === 0) {
        return language === 'pt' ? 'Nenhuma inspeção no período.' : 'No inspections in this period.';
      }
      return inspectionsData.map(ins => {
        const nc = ins.nonConformities > 0
          ? ` | ${language === 'pt' ? 'Não conformidades' : 'Non-conformities'}: ${ins.nonConformities}`
          : '';
        return `  • [${ins.date}] ${ins.title} – ${language === 'pt' ? 'Resultado' : 'Result'}: ${ins.result || ins.status}${nc}`;
      }).join('\n');
    };

    const buildIncidentsSection = () => {
      if (!incidentsData || incidentsData.length === 0) {
        return language === 'pt' ? 'Nenhuma ocorrência no período.' : 'No incidents in this period.';
      }
      return incidentsData.map(inc => {
        const comments = (inc.comments || []).length > 0
          ? '\n' + inc.comments.map(c => `      - "${c.content}"`).join('\n')
          : '';
        return `  • [${inc.date}] ${inc.title} | ${language === 'pt' ? 'Criticidade' : 'Severity'}: ${inc.severity} | ${language === 'pt' ? 'Status' : 'Status'}: ${inc.status}${comments}`;
      }).join('\n');
    };

    const systemsList = (systems || []).map(s => `  • ${s.name} (${s.systemType || ''})`).join('\n');

    const contextBlock = language === 'pt'
      ? `=== DADOS COMPLETOS DO SISTEMA LINCE ===
Cliente: ${clientName || 'N/A'}
Período analisado: ${period.startDate} a ${period.endDate}

SISTEMAS:
${systemsList}

RESUMO ESTATÍSTICO:
  • Total de leituras: ${summary.totalReadings}
  • Leituras dentro da especificação: ${summary.withinRangeCount}
  • Leituras FORA da especificação: ${summary.outOfRangeCount}
  • Total de inspeções: ${summary.totalInspections}
  • Total de ocorrências: ${summary.totalIncidents} (${summary.openIncidents} em aberto)

--- REGISTROS DE MONITORAMENTO ---
${buildReadingsSection()}

--- INSPEÇÕES ---
${buildInspectionsSection()}

--- OCORRÊNCIAS / INCIDENTES ---
${buildIncidentsSection()}
=== FIM DOS DADOS ===`
      : `=== COMPLETE LINCE SYSTEM DATA ===
Client: ${clientName || 'N/A'}
Analysis period: ${period.startDate} to ${period.endDate}

SYSTEMS:
${systemsList}

STATISTICAL SUMMARY:
  • Total readings: ${summary.totalReadings}
  • Within specification: ${summary.withinRangeCount}
  • OUT OF SPECIFICATION: ${summary.outOfRangeCount}
  • Total inspections: ${summary.totalInspections}
  • Total incidents: ${summary.totalIncidents} (${summary.openIncidents} open)

--- MONITORING RECORDS ---
${buildReadingsSection()}

--- INSPECTIONS ---
${buildInspectionsSection()}

--- INCIDENTS / OCCURRENCES ---
${buildIncidentsSection()}
=== END OF DATA ===`;

    const systemPrompt = language === 'pt'
      ? `Você é um especialista sênior em qualidade da água e gestão de sistemas hídricos, com ampla experiência em redação de relatórios técnicos e gerenciais. Você recebe dados reais de monitoramento de um sistema de gestão de tratamento de água e gera relatórios completos, coesos e profissionais conforme solicitado. Use formatação clara com títulos, seções e marcadores quando apropriado. Responda sempre em português brasileiro com linguagem técnica mas acessível ao perfil solicitado pelo usuário (gerencial, operacional, técnico, etc.).`
      : `You are a senior expert in water quality and water system management, with extensive experience writing technical and management reports. You receive real monitoring data from a water treatment management system and generate complete, cohesive, and professional reports as requested. Use clear formatting with headings, sections, and bullet points where appropriate. Always use professional language adapted to the audience profile requested by the user (management, operational, technical, etc.).`;

    const userPrompt = language === 'pt'
      ? `${contextBlock}\n\n=== SOLICITAÇÃO DO USUÁRIO ===\n${prompt}\n\nGere o relatório completo conforme solicitado acima, utilizando exclusivamente os dados reais fornecidos. O relatório deve ser coeso, bem estruturado e adequado ao perfil solicitado.`
      : `${contextBlock}\n\n=== USER REQUEST ===\n${prompt}\n\nGenerate the complete report as requested above, using exclusively the real data provided. The report should be cohesive, well-structured, and appropriate for the requested audience.`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    return {
      success: true,
      report: response.content[0].text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  },

  /**
   * Generate a comprehensive report conclusion based on real monitoring data
   * @param {Object} params
   * @param {string} params.instruction - User's specific instruction / command
   * @param {Object} params.reportContext - Context object with all monitoring data
   * @param {string} params.language - 'pt' or 'en'
   */
  async generateReportConclusion({ instruction, reportContext, language = 'pt' }) {
    const {
      clientName,
      systems,
      period,
      outOfRangeItems,
      withinRangeCount,
      totalReadings,
      inspections,
      incidents,
      summary
    } = reportContext;

    // Build the context block
    const periodStr = language === 'pt'
      ? `Período: ${period.startDate} a ${period.endDate}`
      : `Period: ${period.startDate} to ${period.endDate}`;

    const systemsList = (systems || []).map(s => `- ${s.name} (${s.systemType || ''})`).join('\n') || (language === 'pt' ? '(não especificado)' : '(not specified)');

    const outOfRangeList = (outOfRangeItems || []).length > 0
      ? (outOfRangeItems || []).map(item => {
          if (language === 'pt') {
            return `• ${item.parameter} (${item.systemName}): valor medido = ${item.value} ${item.unit} | limite: ${item.min !== null ? item.min : '–'} – ${item.max !== null ? item.max : '–'} ${item.unit} | FORA DA ESPECIFICAÇÃO`;
          }
          return `• ${item.parameter} (${item.systemName}): measured = ${item.value} ${item.unit} | limit: ${item.min !== null ? item.min : '–'} – ${item.max !== null ? item.max : '–'} ${item.unit} | OUT OF SPEC`;
        }).join('\n')
      : (language === 'pt' ? 'Nenhum resultado fora da especificação.' : 'No out-of-specification results.');

    const inspSummary = (inspections || []).length > 0
      ? (inspections || []).slice(0, 5).map(i => `- ${i.title || i.type || ''}: ${i.result || i.status || ''}`).join('\n')
      : '';

    const incSummary = (incidents || []).length > 0
      ? (incidents || []).slice(0, 5).map(i => `- ${i.title || ''}: ${i.status || ''} (${i.severity || ''})`).join('\n')
      : '';

    const contextBlock = language === 'pt'
      ? `=== DADOS DO RELATÓRIO ===
Cliente: ${clientName || 'N/A'}
${periodStr}

SISTEMAS ANALISADOS:
${systemsList}

RESUMO DAS MEDIÇÕES:
- Total de leituras: ${totalReadings || 0}
- Leituras dentro da especificação: ${withinRangeCount || 0}
- Leituras FORA da especificação: ${(outOfRangeItems || []).length}
- Total de inspeções: ${summary?.totalInspections || 0}
- Total de ocorrências/incidentes: ${summary?.totalIncidents || 0}${summary?.openIncidents ? ` (${summary.openIncidents} em aberto)` : ''}

RESULTADOS FORA DA ESPECIFICAÇÃO:
${outOfRangeList}
${inspSummary ? `\nRESUMO DAS INSPEÇÕES:\n${inspSummary}` : ''}
${incSummary ? `\nOCORRÊNCIAS REGISTRADAS:\n${incSummary}` : ''}
=== FIM DOS DADOS ===`
      : `=== REPORT DATA ===
Client: ${clientName || 'N/A'}
${periodStr}

SYSTEMS ANALYZED:
${systemsList}

MEASUREMENT SUMMARY:
- Total readings: ${totalReadings || 0}
- Within specification: ${withinRangeCount || 0}
- OUT OF SPECIFICATION: ${(outOfRangeItems || []).length}
- Total inspections: ${summary?.totalInspections || 0}
- Total incidents: ${summary?.totalIncidents || 0}${summary?.openIncidents ? ` (${summary.openIncidents} open)` : ''}

OUT-OF-SPECIFICATION RESULTS:
${outOfRangeList}
${inspSummary ? `\nINSPECTION SUMMARY:\n${inspSummary}` : ''}
${incSummary ? `\nINCIDENTS RECORDED:\n${incSummary}` : ''}
=== END OF DATA ===`;

    const userPrompt = language === 'pt'
      ? `${contextBlock}\n\nINSTRUÇÃO DO USUÁRIO:\n${instruction}\n\nGere a conclusão do relatório técnico seguindo exatamente a instrução acima, usando os dados fornecidos. A conclusão deve ser profissional, clara e baseada nos dados reais.`
      : `${contextBlock}\n\nUSER INSTRUCTION:\n${instruction}\n\nGenerate the technical report conclusion following exactly the instruction above, using the provided data. The conclusion should be professional, clear and based on the actual data.`;

    const systemPrompt = language === 'pt'
      ? `Você é um especialista técnico em qualidade da água e tratamento de sistemas hídricos com experiência em redação de relatórios técnicos profissionais. Você analisa dados reais de monitoramento e escreve conclusões precisas, técnicas e acionáveis. Responda SOMENTE com o texto da conclusão, sem prefácios ou explicações adicionais. Use linguagem técnica profissional em português brasileiro.`
      : `You are a technical expert in water quality and water treatment systems with experience in writing professional technical reports. You analyze real monitoring data and write precise, technical, and actionable conclusions. Respond ONLY with the conclusion text, no preambles or additional explanations. Use professional technical language.`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    return {
      success: true,
      conclusion: response.content[0].text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
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
