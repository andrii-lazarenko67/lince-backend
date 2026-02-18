// Quick test script for AI service
require('dotenv').config();
const aiService = require('./src/services/aiService');

async function testAI() {
  console.log('Testing AI Service...\n');

  // Check if configured
  console.log('1. Checking if AI is configured...');
  const isConfigured = aiService.isConfigured();
  console.log(`   ✓ API Key configured: ${isConfigured ? 'YES' : 'NO'}`);

  if (!isConfigured) {
    console.log('   ✗ ANTHROPIC_API_KEY not found in environment');
    return;
  }

  console.log(`   ✓ API Key found: ${process.env.ANTHROPIC_API_KEY.substring(0, 20)}...`);

  // Test simple chat
  console.log('\n2. Testing chat endpoint...');
  try {
    const response = await aiService.chat({
      message: 'Hello! Please respond with "AI service is working" in Portuguese.',
      conversationHistory: [],
      context: {},
      language: 'pt'
    });

    console.log('   ✓ Chat successful!');
    console.log(`   Response: ${response.message.substring(0, 100)}...`);
    console.log(`   Tokens used: ${response.usage.inputTokens} input, ${response.usage.outputTokens} output`);
  } catch (error) {
    console.log(`   ✗ Chat failed: ${error.message}`);
    return;
  }

  console.log('\n✓ All AI service tests passed!');
  console.log('The Anthropic API key is working correctly.\n');
}

testAI()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
