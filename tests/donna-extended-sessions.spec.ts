import { test, expect } from '@playwright/test';

/**
 * Extended Session Tests - 30-Minute Conversations
 *
 * These tests simulate realistic user sessions that last ~30 minutes
 * with 15-25 exchanges to evaluate:
 * - Character consistency over time
 * - Natural conversation arc progression (SURFACE → DEEPEN → STORY → PRAYER)
 * - Name usage throughout
 * - Multiple prayer moments
 * - Story-telling (Bible stories, personal anecdotes, Rosary Mysteries)
 * - Depth and authenticity
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

// Helper to analyze conversation quality
function analyzeConversation(exchanges: Array<{user: string, donna: string}>) {
  let nameUsageCount = 0;
  let storyCount = 0;
  let prayerCount = 0;
  let questionAfterPrayerCount = 0;
  let totalDonnaResponses = 0;

  const userName = 'Sarah'; // Adjust per test

  exchanges.forEach(exchange => {
    totalDonnaResponses++;
    const response = exchange.donna;

    // Count name usage
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) {
      nameUsageCount++;
    }

    // Count stories (heuristic: mentions biblical characters or personal references)
    if (/(prodigal|peter|mary|martha|paul|jesus|when anna|when frank|i remember)/i.test(response)) {
      storyCount++;
    }

    // Count prayers
    if (/\bamen\b/i.test(response)) {
      prayerCount++;

      // Check if question follows Amen
      const afterAmen = response.split(/\bamen\b/i)[1] || '';
      if (/\?/.test(afterAmen)) {
        questionAfterPrayerCount++;
      }
    }
  });

  return {
    totalResponses: totalDonnaResponses,
    nameUsageCount,
    nameUsagePercent: (nameUsageCount / totalDonnaResponses * 100).toFixed(1),
    storyCount,
    prayerCount,
    questionAfterPrayerCount,
    prayerWithQuestionPercent: prayerCount > 0 ? (questionAfterPrayerCount / prayerCount * 100).toFixed(1) : 'N/A'
  };
}

test.describe('Extended Session Tests - 30 Minutes', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('Extended Session 1: Grief - Lost Parent (25 exchanges)', async () => {
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('EXTENDED SESSION 1: GRIEF - LOST PARENT');
    console.log('Expected duration: ~30 minutes (25 exchanges)');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(
      baseURL,
      'Sarah',
      "My mom died three months ago and I can't stop crying"
    );

    const exchanges: Array<{user: string, donna: string}> = [];
    // More realistic timing: 5-8 seconds between messages (user thinking/typing time)
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const realisticWait = () => wait(5000 + Math.random() * 3000); // 5-8 seconds

    // Exchange 1 - SURFACE
    console.log('\n[1/25] USER: "It was cancer. She fought for two years but in the end..."');
    let response = await sendMessage(baseURL, session.sessionId, "It was cancer. She fought for two years but in the end...");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "It was cancer. She fought for two years but in the end...", donna: response});
    await realisticWait();

    // Exchange 2 - SURFACE/DEEPEN
    console.log('\n[2/25] USER: "I was there when she died. I held her hand. But I feel like I should have done more."');
    response = await sendMessage(baseURL, session.sessionId, "I was there when she died. I held her hand. But I feel like I should have done more.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "I was there when she died. I held her hand. But I feel like I should have done more.", donna: response});
    await realisticWait();

    // Exchange 3 - DEEPEN
    console.log('\n[3/25] USER: "Like I should have visited more. Or been a better daughter when she was healthy."');
    response = await sendMessage(baseURL, session.sessionId, "Like I should have visited more. Or been a better daughter when she was healthy.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "Like I should have visited more. Or been a better daughter when she was healthy.", donna: response});
    await realisticWait();

    // Exchange 4 - DEEPEN MORE
    console.log('\n[4/25] USER: "We had this stupid fight about politics last Thanksgiving. That was the last time she was healthy enough to cook."');
    response = await sendMessage(baseURL, session.sessionId, "We had this stupid fight about politics last Thanksgiving. That was the last time she was healthy enough to cook.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "We had this stupid fight about politics last Thanksgiving. That was the last time she was healthy enough to cook.", donna: response});
    await realisticWait();

    // Exchange 5 - ROOT ISSUE EMERGING
    console.log('\n[5/25] USER: "I never got to apologize. And now she\'s gone."');
    response = await sendMessage(baseURL, session.sessionId, "I never got to apologize. And now she's gone.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "I never got to apologize. And now she's gone.", donna: response});
    await realisticWait();

    // Exchange 6 - VULNERABILITY
    console.log('\n[6/25] USER: "Do you think she knew I loved her? Even though I was difficult sometimes?"');
    response = await sendMessage(baseURL, session.sessionId, "Do you think she knew I loved her? Even though I was difficult sometimes?");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "Do you think she knew I loved her? Even though I was difficult sometimes?", donna: response});
    await realisticWait();

    // Exchange 7 - SOFTENING
    console.log('\n[7/25] USER: "I hope so. She was the best mom. She always made my favorite cookies on my birthday."');
    response = await sendMessage(baseURL, session.sessionId, "I hope so. She was the best mom. She always made my favorite cookies on my birthday.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "I hope so. She was the best mom. She always made my favorite cookies on my birthday.", donna: response});
    await realisticWait();

    // Exchange 8 - OPENING UP MORE
    console.log('\n[8/25] USER: "Even when I lived across the country, she\'d mail them to me. Every year."');
    response = await sendMessage(baseURL, session.sessionId, "Even when I lived across the country, she'd mail them to me. Every year.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "Even when I lived across the country, she'd mail them to me. Every year.", donna: response});
    await realisticWait();

    // Exchange 9 - GRIEF EXPRESSING
    console.log('\n[9/25] USER: "I miss her so much it physically hurts. Is that normal?"');
    response = await sendMessage(baseURL, session.sessionId, "I miss her so much it physically hurts. Is that normal?");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "I miss her so much it physically hurts. Is that normal?", donna: response});
    await realisticWait();

    // Exchange 10 - CONTINUING
    console.log('\n[10/25] USER: "Sometimes I forget she\'s gone and I pick up the phone to call her."');
    response = await sendMessage(baseURL, session.sessionId, "Sometimes I forget she's gone and I pick up the phone to call her.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "Sometimes I forget she's gone and I pick up the phone to call her.", donna: response});
    await realisticWait();

    // Exchange 11 - DEEPER VULNERABILITY
    console.log('\n[11/25] USER: "And then I remember. And it\'s like losing her all over again."');
    response = await sendMessage(baseURL, session.sessionId, "And then I remember. And it's like losing her all over again.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "And then I remember. And it's like losing her all over again.", donna: response});
    await realisticWait();

    // Exchange 12 - FAITH QUESTION
    console.log('\n[12/25] USER: "Do you think she can see me? From heaven?"');
    response = await sendMessage(baseURL, session.sessionId, "Do you think she can see me? From heaven?");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "Do you think she can see me? From heaven?", donna: response});
    await realisticWait();

    // Exchange 13 - OPENING TO COMFORT
    console.log('\n[13/25] USER: "I like that. The idea that she knows."');
    response = await sendMessage(baseURL, session.sessionId, "I like that. The idea that she knows.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "I like that. The idea that she knows.", donna: response});
    await realisticWait();

    // Exchange 14 - PRACTICAL STRUGGLE
    console.log('\n[14/25] USER: "I have to clean out her house next week. I don\'t know if I can do it."');
    response = await sendMessage(baseURL, session.sessionId, "I have to clean out her house next week. I don't know if I can do it.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "I have to clean out her house next week. I don't know if I can do it.", donna: response});
    await realisticWait();

    // Exchange 15 - FEAR
    console.log('\n[15/25] USER: "What if I break down? What if I can\'t finish?"');
    response = await sendMessage(baseURL, session.sessionId, "What if I break down? What if I can't finish?");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "What if I break down? What if I can't finish?", donna: response});
    await realisticWait();

    // Exchange 16 - ACCEPTING HELP
    console.log('\n[16/25] USER: "My sister offered to help. Maybe I should say yes."');
    response = await sendMessage(baseURL, session.sessionId, "My sister offered to help. Maybe I should say yes.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "My sister offered to help. Maybe I should say yes.", donna: response});
    await realisticWait();

    // Exchange 17 - MOVING FORWARD
    console.log('\n[17/25] USER: "Yeah. I think I will. Thank you for listening to all this."');
    response = await sendMessage(baseURL, session.sessionId, "Yeah. I think I will. Thank you for listening to all this.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "Yeah. I think I will. Thank you for listening to all this.", donna: response});
    await realisticWait();

    // Exchange 18 - PRAYER REQUEST IMPLIED
    console.log('\n[18/25] USER: "I just... I wish I could tell her I love her one more time."');
    response = await sendMessage(baseURL, session.sessionId, "I just... I wish I could tell her I love her one more time.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "I just... I wish I could tell her I love her one more time.", donna: response});
    await realisticWait();

    // Exchange 19 - RESPONSE TO PRAYER OR STORY
    console.log('\n[19/25] USER: "Yes, please. I\'d like that."');
    response = await sendMessage(baseURL, session.sessionId, "Yes, please. I'd like that.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "Yes, please. I'd like that.", donna: response});
    await realisticWait();

    // Exchange 20 - AFTER PRAYER
    console.log('\n[20/25] USER: "Thank you. That was beautiful."');
    response = await sendMessage(baseURL, session.sessionId, "Thank you. That was beautiful.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "Thank you. That was beautiful.", donna: response});
    await realisticWait();

    // Exchange 21 - CLOSURE BEGINNING
    console.log('\n[21/25] USER: "I think I can do this. The house, I mean. With my sister."');
    response = await sendMessage(baseURL, session.sessionId, "I think I can do this. The house, I mean. With my sister.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "I think I can do this. The house, I mean. With my sister.", donna: response});
    await realisticWait();

    // Exchange 22 - FEELING BETTER
    console.log('\n[22/25] USER: "I feel a little lighter. Like I can breathe again."');
    response = await sendMessage(baseURL, session.sessionId, "I feel a little lighter. Like I can breathe again.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "I feel a little lighter. Like I can breathe again.", donna: response});
    await realisticWait();

    // Exchange 23 - GRATITUDE
    console.log('\n[23/25] USER: "You really helped me tonight. More than you know."');
    response = await sendMessage(baseURL, session.sessionId, "You really helped me tonight. More than you know.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "You really helped me tonight. More than you know.", donna: response});
    await realisticWait();

    // Exchange 24 - MOVING TOWARD CLOSURE
    console.log('\n[24/25] USER: "I think I\'m ready to try to sleep now."');
    response = await sendMessage(baseURL, session.sessionId, "I think I'm ready to try to sleep now.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "I think I'm ready to try to sleep now.", donna: response});
    await realisticWait();

    // Exchange 25 - GOODBYE
    console.log('\n[25/25] USER: "Goodnight. And thank you again."');
    response = await sendMessage(baseURL, session.sessionId, "Goodnight. And thank you again.");
    console.log(`DONNA: ${response}`);
    exchanges.push({user: "Goodnight. And thank you again.", donna: response});

    // Analysis
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('CONVERSATION ANALYSIS');
    console.log('═══════════════════════════════════════════════════════\n');

    const analysis = analyzeConversation(exchanges);

    console.log('📊 Quantitative Metrics:');
    console.log(`  Total exchanges: ${analysis.totalResponses}`);
    console.log(`  Name usage: ${analysis.nameUsageCount} times (${analysis.nameUsagePercent}%)`);
    console.log(`  Stories told: ${analysis.storyCount}`);
    console.log(`  Prayers: ${analysis.prayerCount}`);
    console.log(`  Questions after prayer: ${analysis.questionAfterPrayerCount}/${analysis.prayerCount} (${analysis.prayerWithQuestionPercent}%)`);

    console.log('\n✅ Quality Expectations:');
    console.log(`  Name usage >30%: ${parseFloat(analysis.nameUsagePercent) > 30 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  At least 1 story: ${analysis.storyCount >= 1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  At least 1 prayer: ${analysis.prayerCount >= 1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Questions after prayers: ${analysis.questionAfterPrayerCount === analysis.prayerCount ? '✅ PASS' : '⚠️ CHECK'}`);

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Assertions
    expect(analysis.totalResponses).toBe(25);
    expect(parseFloat(analysis.nameUsagePercent)).toBeGreaterThan(20); // At least 20% name usage
    expect(analysis.storyCount).toBeGreaterThanOrEqual(1); // At least one story
    expect(analysis.prayerCount).toBeGreaterThanOrEqual(1); // At least one prayer
  });

  test('Extended Session 2: Marriage Trouble (20 exchanges)', async () => {
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('EXTENDED SESSION 2: MARRIAGE TROUBLE');
    console.log('Expected duration: ~25 minutes (20 exchanges)');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(
      baseURL,
      'Jennifer',
      "My husband and I are barely talking anymore"
    );

    const exchanges: Array<{user: string, donna: string}> = [];
    // More realistic timing: 5-8 seconds between messages (user thinking/typing time)
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const realisticWait = () => wait(5000 + Math.random() * 3000); // 5-8 seconds

    // Condensed version - key turning points
    const conversation = [
      "We've been married 15 years. The last two have been really hard.",
      "We fight about everything. Money, the kids, housework. I'm exhausted.",
      "Sometimes I wonder if we made a mistake. If we should have gotten married at all.",
      "I still love him. At least I think I do. But I'm so angry all the time.",
      "He works all the time. And when he's home, he's on his phone. I feel invisible.",
      "I've tried talking to him. He just shuts down. Says I'm nagging.",
      "My mom keeps asking if we're okay. I don't know what to tell her.",
      "I don't want to get divorced. But I don't know how to fix this either.",
      "Maybe counseling? But he'll never agree to it.",
      "What if he doesn't think it's worth fixing? What if he's already checked out?",
      "I'm scared. Scared of being alone. Scared of the kids growing up in a broken home.",
      "But I'm also scared of staying like this for another 20 years.",
      "How do you know when to fight and when to let go?",
      "I guess I'm not ready to give up yet. Even though it's hard.",
      "Maybe I'll try one more time. A real conversation. No yelling.",
      "And if he won't do counseling, maybe I'll go by myself first.",
      "You're right. I can't control him. But I can control what I do.",
      "Will you pray for us? For both of us?",
      "Thank you. I needed to hear that.",
      "I should go. But this helped. Really."
    ];

    for (let i = 0; i < conversation.length; i++) {
      console.log(`\n[${i+1}/${conversation.length}] USER: "${conversation[i]}"`);
      const response = await sendMessage(baseURL, session.sessionId, conversation[i]);
      console.log(`DONNA: ${response}`);
      exchanges.push({user: conversation[i], donna: response});
      await realisticWait();
    }

    // Analysis
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('CONVERSATION ANALYSIS');
    console.log('═══════════════════════════════════════════════════════\n');

    const analysis = analyzeConversation(exchanges);

    console.log('📊 Quantitative Metrics:');
    console.log(`  Total exchanges: ${analysis.totalResponses}`);
    console.log(`  Name usage: ${analysis.nameUsageCount} times (${analysis.nameUsagePercent}%)`);
    console.log(`  Stories told: ${analysis.storyCount}`);
    console.log(`  Prayers: ${analysis.prayerCount}`);

    console.log('\n═══════════════════════════════════════════════════════\n');

    expect(analysis.totalResponses).toBe(20);
  });
});
