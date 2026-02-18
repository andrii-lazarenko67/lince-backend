// Test script for AI service multi-language support
require('dotenv').config();
const aiService = require('./src/services/aiService');

async function testMultiLanguage() {
  console.log('🌍 Testing AI Service Multi-Language Support...\n');
  console.log('='.repeat(60));

  // Test 1: Portuguese Chat
  console.log('\n📝 Test 1: Portuguese Chat');
  console.log('-'.repeat(60));
  try {
    const ptResponse = await aiService.chat({
      message: 'O que é pH e por que é importante em tratamento de água?',
      conversationHistory: [],
      context: { page: 'daily-logs' },
      language: 'pt'
    });
    console.log('✓ Portuguese chat successful!');
    console.log(`Response (first 150 chars): ${ptResponse.message.substring(0, 150)}...`);
    console.log(`Tokens: ${ptResponse.usage.inputTokens} in, ${ptResponse.usage.outputTokens} out`);
  } catch (error) {
    console.log(`✗ Portuguese chat failed: ${error.message}`);
  }

  // Test 2: English Chat
  console.log('\n📝 Test 2: English Chat');
  console.log('-'.repeat(60));
  try {
    const enResponse = await aiService.chat({
      message: 'What is pH and why is it important in water treatment?',
      conversationHistory: [],
      context: { page: 'daily-logs' },
      language: 'en'
    });
    console.log('✓ English chat successful!');
    console.log(`Response (first 150 chars): ${enResponse.message.substring(0, 150)}...`);
    console.log(`Tokens: ${enResponse.usage.inputTokens} in, ${enResponse.usage.outputTokens} out`);
  } catch (error) {
    console.log(`✗ English chat failed: ${error.message}`);
  }

  // Test 3: Water Quality Analysis (Portuguese)
  console.log('\n🔬 Test 3: Water Quality Analysis (Portuguese)');
  console.log('-'.repeat(60));
  try {
    const measurements = [
      { parameter: 'pH', value: 8.5, unit: '', limit: { min: 6.5, max: 8.0 } },
      { parameter: 'Cloro Livre', value: 1.2, unit: 'mg/L', limit: { min: 0.5, max: 2.0 } }
    ];
    const analysisResponse = await aiService.analyzeWaterQuality({
      measurements,
      systemType: 'piscina',
      language: 'pt'
    });
    console.log('✓ Portuguese analysis successful!');
    console.log(`Analysis (first 150 chars): ${analysisResponse.analysis.substring(0, 150)}...`);
  } catch (error) {
    console.log(`✗ Portuguese analysis failed: ${error.message}`);
  }

  // Test 4: Water Quality Analysis (English)
  console.log('\n🔬 Test 4: Water Quality Analysis (English)');
  console.log('-'.repeat(60));
  try {
    const measurements = [
      { parameter: 'pH', value: 8.5, unit: '', limit: { min: 6.5, max: 8.0 } },
      { parameter: 'Free Chlorine', value: 1.2, unit: 'mg/L', limit: { min: 0.5, max: 2.0 } }
    ];
    const analysisResponse = await aiService.analyzeWaterQuality({
      measurements,
      systemType: 'swimming pool',
      language: 'en'
    });
    console.log('✓ English analysis successful!');
    console.log(`Analysis (first 150 chars): ${analysisResponse.analysis.substring(0, 150)}...`);
  } catch (error) {
    console.log(`✗ English analysis failed: ${error.message}`);
  }

  // Test 5: Contextual Help (Portuguese)
  console.log('\n❓ Test 5: Contextual Help (Portuguese)');
  console.log('-'.repeat(60));
  try {
    const helpResponse = await aiService.getContextualHelp({
      page: 'daily-logs',
      feature: 'adicionar registro',
      language: 'pt'
    });
    console.log('✓ Portuguese help successful!');
    console.log(`Help (first 150 chars): ${helpResponse.help.substring(0, 150)}...`);
  } catch (error) {
    console.log(`✗ Portuguese help failed: ${error.message}`);
  }

  // Test 6: Contextual Help (English)
  console.log('\n❓ Test 6: Contextual Help (English)');
  console.log('-'.repeat(60));
  try {
    const helpResponse = await aiService.getContextualHelp({
      page: 'daily-logs',
      feature: 'add log entry',
      language: 'en'
    });
    console.log('✓ English help successful!');
    console.log(`Help (first 150 chars): ${helpResponse.help.substring(0, 150)}...`);
  } catch (error) {
    console.log(`✗ English help failed: ${error.message}`);
  }

  // Test 7: Alert Interpretation (Portuguese)
  console.log('\n⚠️  Test 7: Alert Interpretation (Portuguese)');
  console.log('-'.repeat(60));
  try {
    const alert = {
      parameter: 'pH',
      value: 9.2,
      unit: '',
      limit: 8.0,
      severity: 'high'
    };
    const interpretResponse = await aiService.interpretAlert({
      alert,
      systemType: 'piscina',
      language: 'pt'
    });
    console.log('✓ Portuguese interpretation successful!');
    console.log(`Interpretation (first 150 chars): ${interpretResponse.interpretation.substring(0, 150)}...`);
  } catch (error) {
    console.log(`✗ Portuguese interpretation failed: ${error.message}`);
  }

  // Test 8: Alert Interpretation (English)
  console.log('\n⚠️  Test 8: Alert Interpretation (English)');
  console.log('-'.repeat(60));
  try {
    const alert = {
      parameter: 'pH',
      value: 9.2,
      unit: '',
      limit: 8.0,
      severity: 'high'
    };
    const interpretResponse = await aiService.interpretAlert({
      alert,
      systemType: 'swimming pool',
      language: 'en'
    });
    console.log('✓ English interpretation successful!');
    console.log(`Interpretation (first 150 chars): ${interpretResponse.interpretation.substring(0, 150)}...`);
  } catch (error) {
    console.log(`✗ English interpretation failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All multi-language tests completed!\n');
}

testMultiLanguage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
