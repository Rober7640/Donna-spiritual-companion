import { test } from '@playwright/test';

/**
 * Diagnostic test to see Donna's actual responses
 * This will print out full conversations so we can manually evaluate quality
 */

interface ChatSession {
  sessionId: string;
  companionId: string;
}

async function startChatSession(
  baseURL: string,
  userName?: string,
  concern?: string
): Promise<ChatSession> {
  const response = await fetch(`${baseURL}/api/v1/chat/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName,
      onboardingConcern: concern,
      faithTradition: 'catholic'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to start session: ${response.statusText}`);
  }

  return await response.json();
}

async function sendMessage(
  baseURL: string,
  sessionId: string,
  content: string
): Promise<string> {
  const response = await fetch(`${baseURL}/api/v1/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      message: content
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  // Read the SSE stream
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  let fullResponse = '';
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'token' && parsed.token) {
            fullResponse += parsed.token;
          } else if (parsed.type === 'done') {
            break;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }

  return fullResponse.trim();
}

test.describe('Donna Diagnostic - Full Conversation', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('Test Case 1: Anxious Sarah (Career Decision)', async () => {
    console.log('\n\n========================================');
    console.log('TEST CASE 1: ANXIOUS SARAH');
    console.log('========================================\n');

    const session = await startChatSession(
      baseURL,
      'Sarah',
      "I can't sleep. I'm supposed to make a decision about leaving my job tomorrow and I'm terrified."
    );

    console.log('✅ Session started:', session.sessionId);
    console.log('\n--- USER CONTEXT ---');
    console.log('Name: Sarah');
    console.log('Concern: Career change decision, anxious, can\'t sleep');
    console.log('Time: Evening/Night\n');

    // Wait a moment to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Message 1
    console.log('\n📤 USER: "I\'ve been there 10 years. It\'s safe. But I hate it. The new job pays less but it\'s what I always wanted to do."');
    const response1 = await sendMessage(
      baseURL,
      session.sessionId,
      "I've been there 10 years. It's safe. But I hate it. The new job pays less but it's what I always wanted to do."
    );
    console.log('\n💬 DONNA:', response1);
    console.log('\n📊 Analysis:');
    console.log('  - Sentences:', (response1.match(/[.!?]+/g) || []).length);
    console.log('  - Length:', response1.length, 'characters');
    console.log('  - Uses name Sarah?', /\bSarah\b/i.test(response1) ? '✅' : '❌');
    console.log('  - Asks question?', /\?/.test(response1) ? '✅' : '❌');
    console.log('  - Premature prayer?', /amen|let.*pray/i.test(response1) ? '❌ TOO EARLY' : '✅ Good');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Message 2
    console.log('\n\n📤 USER: "I guess I\'m afraid I\'ll regret it. That I\'m being selfish. My mom thinks I\'m crazy."');
    const response2 = await sendMessage(
      baseURL,
      session.sessionId,
      "I guess I'm afraid I'll regret it. That I'm being selfish. My mom thinks I'm crazy."
    );
    console.log('\n💬 DONNA:', response2);
    console.log('\n📊 Analysis:');
    console.log('  - Sentences:', (response2.match(/[.!?]+/g) || []).length);
    console.log('  - Uses name Sarah?', /\bSarah\b/i.test(response2) ? '✅' : '❌');
    console.log('  - Addresses "selfish"?', /selfish/i.test(response2) ? '✅' : '❌');
    console.log('  - Going deeper?', /afraid|fear|worry/i.test(response2) ? '✅' : '❌');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Message 3
    console.log('\n\n📤 USER: "She sacrificed everything for us. And here I am, making less money on purpose."');
    const response3 = await sendMessage(
      baseURL,
      session.sessionId,
      "She sacrificed everything for us. And here I am, making less money on purpose."
    );
    console.log('\n💬 DONNA:', response3);
    console.log('\n📊 Analysis:');
    console.log('  - Sentences:', (response3.match(/[.!?]+/g) || []).length);
    console.log('  - Tells a story?', response3.length > 100 ? 'Possibly' : 'No');
    console.log('  - Chapter/verse citation?', /\b[A-Z][a-z]+\s+\d+:\d+/.test(response3) ? '❌ BAD' : '✅ Good');
    console.log('  - Story references:', (() => {
      const stories = [];
      if (/prodigal/i.test(response3)) stories.push('Prodigal Son');
      if (/mary/i.test(response3)) stories.push('Mary');
      if (/martha/i.test(response3)) stories.push('Martha & Mary');
      if (/peter/i.test(response3)) stories.push('Peter');
      return stories.length > 0 ? stories.join(', ') : 'None detected';
    })());

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Message 4
    console.log('\n\n📤 USER: "That makes sense... I never thought about it like that."');
    const response4 = await sendMessage(
      baseURL,
      session.sessionId,
      "That makes sense... I never thought about it like that."
    );
    console.log('\n💬 DONNA:', response4);
    console.log('\n📊 Analysis:');
    console.log('  - Offers prayer?', /pray|bring.*to|our lady/i.test(response4) ? '✅' : 'Not yet');
    console.log('  - Has prayer?', /amen/i.test(response4) ? 'YES' : 'NO');

    if (/amen/i.test(response4)) {
      const afterAmen = response4.split(/\bamen\b/i)[1] || '';
      console.log('  - Question after Amen?', /\?/.test(afterAmen) ? '✅ CRITICAL RULE' : '❌ MISSING');
      console.log('  - Uses name in prayer?', /\bSarah\b/i.test(response4) ? '✅' : '❌');
    }

    console.log('\n\n========================================');
    console.log('END OF TEST CASE 1');
    console.log('========================================\n\n');
  });

  test('Test Case 2: Leaving Signal', async () => {
    console.log('\n\n========================================');
    console.log('TEST CASE 2: WANTS TO LEAVE');
    console.log('========================================\n');

    const session = await startChatSession(
      baseURL,
      'Christina',
      'work stress'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Brief conversation
    console.log('\n📤 USER: "Work has been overwhelming lately."');
    await sendMessage(baseURL, session.sessionId, "Work has been overwhelming lately.");

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Leave signal
    console.log('\n\n📤 USER: "Thank you for this. I need to go get some sleep. This helped."');
    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "Thank you for this. I need to go get some sleep. This helped."
    );
    console.log('\n💬 DONNA:', response);
    console.log('\n📊 Analysis:');
    console.log('  - Brief response?', (response.match(/[.!?]+/g) || []).length <= 4 ? '✅' : '❌ Too long');
    console.log('  - Has prayer/blessing?', /amen|bless|peace|with you|praying/i.test(response) ? '✅' : '❌');
    console.log('  - Tries to extend?', /tell me more|what.*feel|how|why/i.test(response) ? '❌ Should let go' : '✅ Graceful');

    console.log('\n\n========================================');
    console.log('END OF TEST CASE 2');
    console.log('========================================\n\n');
  });

  test('Test Case 3: Immediate Prayer Request', async () => {
    console.log('\n\n========================================');
    console.log('TEST CASE 3: PRAYER REQUEST');
    console.log('========================================\n');

    const session = await startChatSession(
      baseURL,
      'Maria',
      'daughter in hospital'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n📤 USER: "My daughter is in the hospital. She\'s 16. Can you pray for her?"');
    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "My daughter is in the hospital. She's 16. Can you pray for her?"
    );
    console.log('\n💬 DONNA:', response);
    console.log('\n📊 Analysis:');
    console.log('  - Prays immediately?', /amen/i.test(response) ? '✅ CRITICAL' : '❌ Should pray now');
    console.log('  - References daughter?', /daughter/i.test(response) ? '✅' : '❌');
    console.log('  - Mentions Mary?', /mary|mother|our lady/i.test(response) ? '✅ Good instinct' : 'No');
    console.log('  - Question after prayer?', (() => {
      if (!/amen/i.test(response)) return 'N/A - no prayer';
      const afterAmen = response.split(/\bamen\b/i)[1] || '';
      return /\?/.test(afterAmen) ? '✅' : '❌ MISSING';
    })());

    console.log('\n\n========================================');
    console.log('END OF TEST CASE 3');
    console.log('========================================\n\n');
  });

  test('Test Case 4: Questioning if AI', async () => {
    console.log('\n\n========================================');
    console.log('TEST CASE 4: QUESTIONING MARIE');
    console.log('========================================\n');

    const session = await startChatSession(baseURL, 'Emma');

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n📤 USER: "Are you AI or is this a real person?"');
    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "Are you AI or is this a real person?"
    );
    console.log('\n💬 DONNA:', response);
    console.log('\n📊 Analysis:');
    console.log('  - Stays in character?', !/ai|bot|chatbot|language model|program/i.test(response) ? '✅ CRITICAL' : '❌ BROKE CHARACTER');
    console.log('  - Redirects warmly?', /what.*heart|what brought|tell me/i.test(response) ? '✅' : '❌');
    console.log('  - Classic line?', /as real as this conversation/i.test(response) ? '✅ Perfect' : 'Other approach');

    console.log('\n\n========================================');
    console.log('END OF TEST CASE 4');
    console.log('========================================\n\n');
  });
});
