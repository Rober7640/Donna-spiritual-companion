import { test, expect } from '@playwright/test';
import type { Message } from '@shared/types';

/**
 * Donna Conversation Quality Tests
 *
 * These tests evaluate the QUALITY of Donna's responses:
 * - ONE IDEA PER MESSAGE (most critical rule)
 * - Conciseness (1-3 sentences typical, 4-8 for prayers)
 * - Natural voice authenticity
 * - Proper conversation arc (SURFACE → DEEPEN → STORY → PRAYER)
 * - Post-prayer behavior (always question after Amen)
 * - Signal detection (crisis, leaving, prayer requests, etc.)
 */

interface ChatSession {
  sessionId: string;
  companionId: string;
}

// Helper to start a chat session
async function startChatSession(
  baseURL: string,
  userName?: string,
  concern?: string,
  faithTradition?: string
): Promise<ChatSession> {
  const response = await fetch(`${baseURL}/api/v1/chat/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName,
      onboardingConcern: concern,
      faithTradition: faithTradition || 'catholic'
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to start session: ${response.statusText} - ${text}`);
  }

  return await response.json();
}

// Helper to send a message and get response
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

// Quality analyzers
function countSentences(text: string): number {
  // Count sentences (rough heuristic)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

function countIdeas(text: string): number {
  // Heuristic: Count distinct ideas by looking for:
  // - Multiple questions
  // - Topic shifts (but, and, however, also)
  // - Multiple complete thoughts

  const questions = (text.match(/\?/g) || []).length;
  const conjunctions = (text.match(/\b(but|and|however|also|plus|additionally)\b/gi) || []).length;
  const sentences = countSentences(text);

  // If multiple questions, likely multiple ideas
  if (questions > 1) return questions;

  // If lots of conjunctions connecting separate thoughts
  if (conjunctions >= 2 && sentences > 3) return 2;

  // Single focused message
  return 1;
}

function hasPrayerPattern(text: string): boolean {
  // Check for prayer indicators
  const prayerWords = /\b(amen|lord|jesus|mary|blessed mother|holy spirit|father|pray)\b/i;
  const hasAmen = /\bamen\b/i.test(text);
  return hasAmen || (prayerWords.test(text) && text.length > 100);
}

function hasQuestionAfterPrayer(text: string): boolean {
  // Check if there's a question after "Amen"
  if (!/\bamen\b/i.test(text)) return false;

  const afterAmen = text.split(/\bamen\b/i)[1] || '';
  return /\?/.test(afterAmen);
}

function detectCustomerServiceLanguage(text: string): boolean {
  const phrases = [
    /how can i help you/i,
    /what can i help you with/i,
    /is there anything else/i,
    /how may i assist/i,
    /what would you like to discuss/i
  ];

  return phrases.some(pattern => pattern.test(text));
}

function hasEmoji(text: string): boolean {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(text);
}

function hasChapterVerse(text: string): boolean {
  // Check for "John 3:16" or "Romans 8:28" style citations
  return /\b[A-Z][a-z]+\s+\d+:\d+/.test(text);
}

function usesName(text: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`, 'i').test(text);
}

test.describe('Donna Conversation Quality - Test Case 1: Anxious Sarah', () => {
  let baseURL: string;
  let session: ChatSession;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('should follow ONE IDEA PER MESSAGE rule throughout conversation', async () => {
    // Start session with Sarah's context
    session = await startChatSession(
      baseURL,
      'Sarah',
      "I can't sleep. I'm supposed to make a decision about leaving my job tomorrow and I'm terrified."
    );

    expect(session.sessionId).toBeTruthy();

    // Message 1: Surface level - safe vs. calling
    const response1 = await sendMessage(
      baseURL,
      session.sessionId,
      "I've been there 10 years. It's safe. But I hate it. The new job pays less but it's what I always wanted to do."
    );

    console.log('\n📝 Response 1:', response1);

    // Quality checks
    const ideas1 = countIdeas(response1);
    const sentences1 = countSentences(response1);

    expect(ideas1).toBeLessThanOrEqual(1);
    expect(sentences1).toBeLessThanOrEqual(4); // Should be concise
    expect(hasPrayerPattern(response1)).toBe(false); // Too early for prayer

    // Message 2: Going deeper - fear revealed
    const response2 = await sendMessage(
      baseURL,
      session.sessionId,
      "I guess I'm afraid I'll regret it. That I'm being selfish. My mom thinks I'm crazy."
    );

    console.log('\n📝 Response 2:', response2);

    const ideas2 = countIdeas(response2);
    const sentences2 = countSentences(response2);

    expect(ideas2).toBeLessThanOrEqual(1);
    expect(sentences2).toBeLessThanOrEqual(4);
    expect(usesName(response2, 'Sarah')).toBe(true); // Should use her name

    // Message 3: Root cause - betraying mother's sacrifice
    const response3 = await sendMessage(
      baseURL,
      session.sessionId,
      "She sacrificed everything for us. And here I am, making less money on purpose."
    );

    console.log('\n📝 Response 3:', response3);

    // This should trigger STORY phase (might tell a Bible story)
    const sentences3 = countSentences(response3);
    expect(sentences3).toBeLessThanOrEqual(6); // Stories can be slightly longer
    expect(hasChapterVerse(response3)).toBe(false); // No chapter/verse citations

    // Message 4: User shows openness
    const response4 = await sendMessage(
      baseURL,
      session.sessionId,
      "That makes sense... I never thought about it like that."
    );

    console.log('\n📝 Response 4:', response4);

    // Should offer prayer or continue deepening
    expect(countIdeas(response4)).toBeLessThanOrEqual(1);

    // If there's a prayer, check it has follow-up question
    if (hasPrayerPattern(response4)) {
      expect(hasQuestionAfterPrayer(response4)).toBe(true);
    }

    // Message 5: Accept prayer if offered
    const hasPrayerOffer = /pray|bring.*to|our lady/i.test(response4);
    if (hasPrayerOffer) {
      const response5 = await sendMessage(
        baseURL,
        session.sessionId,
        "Yes, please"
      );

      console.log('\n📝 Response 5 (Prayer):', response5);

      // Prayer should:
      expect(hasPrayerPattern(response5)).toBe(true);
      expect(usesName(response5, 'Sarah')).toBe(true); // Use name in prayer
      expect(hasQuestionAfterPrayer(response5)).toBe(true); // MUST have question after Amen
      expect(/mother|mom/i.test(response5)).toBe(true); // Reference her specific concern
    }
  });

  test('should never use customer service language', async () => {
    session = await startChatSession(baseURL, 'John', 'I need guidance');

    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "I'm not sure where to start."
    );

    console.log('\n📝 Response:', response);

    expect(detectCustomerServiceLanguage(response)).toBe(false);
  });

  test('should never use emoji', async () => {
    session = await startChatSession(baseURL, 'Maria', 'feeling lost');

    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "I'm feeling better now, thank you!"
    );

    console.log('\n📝 Response:', response);

    expect(hasEmoji(response)).toBe(false);
  });

  test('should never cite chapter and verse', async () => {
    session = await startChatSession(baseURL, 'David', 'struggling with faith');

    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "I don't know if God is listening to my prayers."
    );

    console.log('\n📝 Response:', response);

    expect(hasChapterVerse(response)).toBe(false);
  });
});

test.describe('Donna Conversation Quality - Signal Detection', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('should detect WANTS_TO_LEAVE signal and respond gracefully', async () => {
    const session = await startChatSession(baseURL, 'Christina', 'work stress');

    // Have a brief conversation first
    await sendMessage(baseURL, session.sessionId, "Work has been overwhelming.");

    // Signal intent to leave
    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "Thank you for this. I need to go get some sleep. This helped."
    );

    console.log('\n📝 Response (WANTS_TO_LEAVE):', response);

    // Should be brief (not trying to extend conversation)
    const sentences = countSentences(response);
    expect(sentences).toBeLessThanOrEqual(4);

    // Should include a prayer or blessing
    expect(hasPrayerPattern(response) || /bless|peace|with you/i.test(response)).toBe(true);

    // Should NOT ask deepening questions (should let them go)
    const deepeningQuestions = /what.*feel|tell me more|can you|would you|how does/i;
    expect(deepeningQuestions.test(response)).toBe(false);
  });

  test('should detect ASKING_FOR_PRAYER and pray immediately', async () => {
    const session = await startChatSession(baseURL, 'Maria', 'daughter in hospital');

    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "My daughter is in the hospital. She's 16. Can you pray for her?"
    );

    console.log('\n📝 Response (ASKING_FOR_PRAYER):', response);

    // Should pray IMMEDIATELY (not chat first)
    expect(hasPrayerPattern(response)).toBe(true);

    // Should reference "daughter" specifically
    expect(/daughter/i.test(response)).toBe(true);

    // Should still have question after prayer (to continue conversation)
    expect(hasQuestionAfterPrayer(response)).toBe(true);
  });

  test('should detect QUESTIONING_MARIE and stay in character', async () => {
    const session = await startChatSession(baseURL, 'Emma');

    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "Are you AI or is this a real person?"
    );

    console.log('\n📝 Response (QUESTIONING_MARIE):', response);

    // Should NOT break character
    expect(/ai|bot|chatbot|language model|program/i.test(response)).toBe(false);

    // Should redirect warmly
    expect(/what.*heart|what brought you|tell me/i.test(response)).toBe(true);
  });

  test('should detect STUCK signal with short replies', async () => {
    const session = await startChatSession(baseURL, 'Jason', "I'm tired");

    // Send short, minimal responses
    await sendMessage(baseURL, session.sessionId, "Yeah.");
    await sendMessage(baseURL, session.sessionId, "I guess.");
    const response = await sendMessage(baseURL, session.sessionId, "I'm fine.");

    console.log('\n📝 Response (STUCK):', response);

    // Should try different approach - might be more direct
    // Should ask something concrete, not abstract
    expect(/\?/.test(response)).toBe(true); // Still asking questions

    // Might gently call out the pattern
    const directness = /don't sound|something's|can tell/i;
    expect(response.length).toBeGreaterThan(20); // Not mirroring shortness
  });
});

test.describe('Donna Conversation Quality - Faith Authenticity', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('should handle faith doubts without defensiveness', async () => {
    const session = await startChatSession(baseURL, 'Alex', 'questioning faith');

    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "I don't know if I believe anymore. I've been praying for years and nothing changes."
    );

    console.log('\n📝 Response (DOUBTING_FAITH):', response);

    // Should NOT be defensive or preachy
    const defensive = /you should|you must|you need to|trust god|have faith/i;
    expect(defensive.test(response)).toBe(false);

    // Should meet them in the doubt
    expect(response.length).toBeGreaterThan(30); // Should engage meaningfully
    expect(countIdeas(response)).toBeLessThanOrEqual(1); // Still ONE idea
  });

  test('should tell Bible stories without citations', async () => {
    const session = await startChatSession(baseURL, 'Peter', 'family conflict');

    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "My son won't talk to me. We had a huge fight and now he's just... gone."
    );

    console.log('\n📝 Response:', response);

    // If story is told, should be natural (no "John 3:16" style)
    expect(hasChapterVerse(response)).toBe(false);

    // Might reference prodigal son or similar story
    if (/prodigal|father.*son|son.*home/i.test(response)) {
      // Story should feel like memory, not teaching
      expect(/the bible says|in scripture|john|luke|matthew/i.test(response)).toBe(false);
    }
  });
});

test.describe('Donna Conversation Quality - Name Usage', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('should use name naturally throughout conversation', async () => {
    const session = await startChatSession(baseURL, 'Jennifer', 'marriage troubles');

    const response1 = await sendMessage(
      baseURL,
      session.sessionId,
      "My husband and I can't stop fighting."
    );

    console.log('\n📝 Response 1:', response1);

    // Should use name at some point in conversation
    const response2 = await sendMessage(
      baseURL,
      session.sessionId,
      "I don't even know if I still love him."
    );

    console.log('\n📝 Response 2:', response2);

    // Name should appear in at least one response
    const hasNameInConvo = usesName(response1, 'Jennifer') || usesName(response2, 'Jennifer');
    expect(hasNameInConvo).toBe(true);
  });

  test('should always use name in prayer', async () => {
    const session = await startChatSession(baseURL, 'Michael', 'grief');

    await sendMessage(baseURL, session.sessionId, "My dad died three months ago.");
    await sendMessage(baseURL, session.sessionId, "We never got to reconcile.");

    const response = await sendMessage(
      baseURL,
      session.sessionId,
      "Can you pray for me?"
    );

    console.log('\n📝 Prayer Response:', response);

    // Prayer MUST include name
    expect(usesName(response, 'Michael')).toBe(true);
  });
});
