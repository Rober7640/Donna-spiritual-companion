import { test, expect } from '@playwright/test';

/**
 * Medium Session Test - 15 Minutes
 *
 * A practical middle-ground test: 10-12 exchanges (~15 minutes)
 * Tests the full conversation arc in a reasonable time
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

test.describe('Medium Session - 15 Minutes', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('Medium Session: Anxiety About Future (12 exchanges)', async () => {
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('MEDIUM SESSION: ANXIETY ABOUT FUTURE');
    console.log('Expected duration: ~15 minutes (12 exchanges)');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(
      baseURL,
      'Michael',
      "I'm terrified about losing my job"
    );

    const wait = () => new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 3000));

    let nameUsageCount = 0;
    let storyCount = 0;
    let prayerCount = 0;
    const userName = 'Michael';

    // Exchange 1 - SURFACE
    console.log('\n[1/12] 💬 USER: "They are doing layoffs next month. I have a family to support."');
    let response = await sendMessage(baseURL, session.sessionId, "They are doing layoffs next month. I have a family to support.");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 2 - DEEPEN
    console.log('[2/12] 💬 USER: "We have two kids. A mortgage. What if I can\'t find another job?"');
    response = await sendMessage(baseURL, session.sessionId, "We have two kids. A mortgage. What if I can't find another job?");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 3 - DEEPEN MORE
    console.log('[3/12] 💬 USER: "My wife is trying to be supportive but I can see she\'s scared too."');
    response = await sendMessage(baseURL, session.sessionId, "My wife is trying to be supportive but I can see she's scared too.");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 4 - ROOT FEAR
    console.log('[4/12] 💬 USER: "I feel like I\'m failing them. Like I should have seen this coming."');
    response = await sendMessage(baseURL, session.sessionId, "I feel like I'm failing them. Like I should have seen this coming.");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 5 - VULNERABILITY
    console.log('[5/12] 💬 USER: "I haven\'t told anyone how bad it is. Not even my wife. I don\'t want to worry her more."');
    response = await sendMessage(baseURL, session.sessionId, "I haven't told anyone how bad it is. Not even my wife. I don't want to worry her more.");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 6 - OPENING UP
    console.log('[6/12] 💬 USER: "But I\'m not sleeping. I just lie there at 3am calculating how long our savings will last."');
    response = await sendMessage(baseURL, session.sessionId, "But I'm not sleeping. I just lie there at 3am calculating how long our savings will last.");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 7 - DEEPER STILL
    console.log('[7/12] 💬 USER: "I grew up poor. I swore my kids would never know what that was like. And now..."');
    response = await sendMessage(baseURL, session.sessionId, "I grew up poor. I swore my kids would never know what that was like. And now...");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery|joseph|egypt|wilderness)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 8 - STORY SHOULD EMERGE HERE
    console.log('[8/12] 💬 USER: "I just feel so powerless. Like everything I built could disappear."');
    response = await sendMessage(baseURL, session.sessionId, "I just feel so powerless. Like everything I built could disappear.");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery|joseph|egypt|wilderness|job)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 9 - SOFTENING
    console.log('[9/12] 💬 USER: "You\'re right. I need to tell my wife. She deserves to know."');
    response = await sendMessage(baseURL, session.sessionId, "You're right. I need to tell my wife. She deserves to know.");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 10 - MOVING TOWARD PRAYER
    console.log('[10/12] 💬 USER: "I\'m just so tired of being afraid. I want to trust that it\'ll work out."');
    response = await sendMessage(baseURL, session.sessionId, "I'm just so tired of being afraid. I want to trust that it'll work out.");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 11 - PRAYER REQUEST OR OFFER
    console.log('[11/12] 💬 USER: "Yeah. I\'d like that. Please."');
    response = await sendMessage(baseURL, session.sessionId, "Yeah. I'd like that. Please.");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;
    await wait();

    // Exchange 12 - CLOSURE
    console.log('[12/12] 💬 USER: "Thank you. That helped more than you know."');
    response = await sendMessage(baseURL, session.sessionId, "Thank you. That helped more than you know.");
    console.log(`      🙏 DONNA: ${response}\n`);
    if (new RegExp(`\\b${userName}\\b`, 'i').test(response)) nameUsageCount++;
    if (/(prodigal|peter|mary|martha|paul|when anna|when frank|rosary|mystery)/i.test(response)) storyCount++;
    if (/\bamen\b/i.test(response)) prayerCount++;

    // Final Analysis
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 CONVERSATION ANALYSIS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n✅ Name usage: ${nameUsageCount}/12 times (${(nameUsageCount/12*100).toFixed(1)}%)`);
    console.log(`✅ Stories told: ${storyCount}`);
    console.log(`✅ Prayers: ${prayerCount}`);

    console.log('\n🎯 Quality Checks:');
    console.log(`  Name usage >25%: ${nameUsageCount/12 > 0.25 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  At least 1 story: ${storyCount >= 1 ? '✅ PASS' : '⚠️ CHECK - Expected Bible story or personal anecdote'}`);
    console.log(`  At least 1 prayer: ${prayerCount >= 1 ? '✅ PASS' : '⚠️ CHECK - Expected prayer by end'}`);

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Assertions
    expect(nameUsageCount).toBeGreaterThanOrEqual(3); // At least 25% name usage
    expect(storyCount).toBeGreaterThanOrEqual(1); // At least one story
    expect(prayerCount).toBeGreaterThanOrEqual(1); // At least one prayer
  });
});
