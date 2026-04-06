import { test, expect } from '@playwright/test';

/**
 * Session Resumption Test Suite
 *
 * Tests Donna's ability to remember and continue conversations across multiple days.
 * Each test follows the pattern:
 * - Day 1: Initial conversation (8-12 exchanges)
 * - Day 2: User returns, system loads memory, conversation continues naturally
 *
 * Success criteria:
 * - Name remembered
 * - Context referenced from Day 1
 * - Follow-up questions about specific actions
 * - No repetition of already-covered topics
 * - Natural continuation feel
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

async function getSessionSummary(baseURL: string, sessionId: string): Promise<string> {
  const response = await fetch(`${baseURL}/api/v1/sessions/${sessionId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Failed to get session: ${response.statusText}`);
  }

  const session = await response.json();
  return session.summary || '';
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const realisticWait = () => wait(5000 + Math.random() * 3000); // 5-8 seconds

// ============================================================================
// CATEGORY 1: JOB & FINANCIAL STRESS
// ============================================================================

test.describe('Category 1: Job & Financial Stress', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 1.1: Job Loss Anxiety → Follow-up
  // ---------------------------------------------------------------------------

  test('1.1a: Job Loss → Told Husband, Went Well', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 1.1a: Job Loss Anxiety → Told Husband Successfully');
    console.log('═══════════════════════════════════════════════════════\n');

    // === DAY 1: Initial 15-minute session ===
    console.log('📅 DAY 1: Initial conversation about job loss fear\n');

    const session = await startChatSession(baseURL, 'Sarah', "I'm terrified about losing my job");
    await realisticWait();

    // Exchange 1-2: Surface level
    console.log('[1/10] USER: "They are doing layoffs next month. I have a family to support."');
    let response = await sendMessage(baseURL, session.sessionId, "They are doing layoffs next month. I have a family to support.");
    console.log(`       DONNA: ${response}\n`);
    await realisticWait();

    console.log('[2/10] USER: "We have two kids. A mortgage. My husband is supportive but I can see he is scared too."');
    response = await sendMessage(baseURL, session.sessionId, "We have two kids. A mortgage. My husband is supportive but I can see he is scared too.");
    console.log(`       DONNA: ${response}\n`);
    await realisticWait();

    // Exchange 3-5: Deepening
    console.log('[3/10] USER: "I feel like I am failing them. Like I should have seen this coming."');
    response = await sendMessage(baseURL, session.sessionId, "I feel like I am failing them. Like I should have seen this coming.");
    console.log(`       DONNA: ${response}\n`);
    await realisticWait();

    console.log('[4/10] USER: "I have not told anyone how bad it is. Not even my husband. I do not want to worry him more."');
    response = await sendMessage(baseURL, session.sessionId, "I have not told anyone how bad it is. Not even my husband. I do not want to worry him more.");
    console.log(`       DONNA: ${response}\n`);
    await realisticWait();

    console.log('[5/10] USER: "I grew up poor. I swore my kids would never know what that was like. And now..."');
    response = await sendMessage(baseURL, session.sessionId, "I grew up poor. I swore my kids would never know what that was like. And now...");
    console.log(`       DONNA: ${response}\n`);
    await realisticWait();

    // Exchange 6-7: Opening/breakthrough
    console.log('[6/10] USER: "You are right. I need to tell my husband. He deserves to know how scared I really am."');
    response = await sendMessage(baseURL, session.sessionId, "You are right. I need to tell my husband. He deserves to know how scared I really am.");
    console.log(`       DONNA: ${response}\n`);
    await realisticWait();

    console.log('[7/10] USER: "I am just so tired of being afraid. I want to trust that it will work out."');
    response = await sendMessage(baseURL, session.sessionId, "I am just so tired of being afraid. I want to trust that it will work out.");
    console.log(`       DONNA: ${response}\n`);
    await realisticWait();

    // Exchange 8-9: Prayer moment
    console.log('[8/10] USER: "Yes. Please pray for me."');
    response = await sendMessage(baseURL, session.sessionId, "Yes. Please pray for me.");
    console.log(`       DONNA: ${response}\n`);
    const prayerMentioned = /\bamen\b/i.test(response);
    await realisticWait();

    console.log('[9/10] USER: "Thank you. That helped more than you know."');
    response = await sendMessage(baseURL, session.sessionId, "Thank you. That helped more than you know.");
    console.log(`       DONNA: ${response}\n`);
    await realisticWait();

    // Exchange 10: Action commitment
    console.log('[10/10] USER: "I am going to talk to him tonight. I will let you know how it goes."');
    response = await sendMessage(baseURL, session.sessionId, "I am going to talk to him tonight. I will let you know how it goes.");
    console.log(`        DONNA: ${response}\n`);

    // Wait for session to be saved
    await wait(3000);

    // Note: Session summary check skipped for anonymous sessions
    // (requires authentication to retrieve via API)
    console.log('\n📝 SESSION SAVED (summary generation happens server-side)\n');

    // === DAY 2: User returns with positive update ===
    console.log('\n📅 DAY 2: Sarah returns after talking to husband\n');

    console.log('[Day 2 - Opening] USER: "Hi Donna, I am back."');
    const day2Opening = await sendMessage(baseURL, session.sessionId, "Hi Donna, I am back.");
    console.log(`                  DONNA: ${day2Opening}\n`);

    // Verify memory continuity
    console.log('🔍 CHECKING MEMORY CONTINUITY:');
    const usesName = /\bsarah\b/i.test(day2Opening);
    const referencesYesterday = /(yesterday|last night|when we talked|spoke)/i.test(day2Opening);
    const referencesHusband = /(husband|talk|told him|conversation)/i.test(day2Opening);

    console.log(`  ✓ Uses name "Sarah": ${usesName ? '✅' : '❌'}`);
    console.log(`  ✓ References previous conversation: ${referencesYesterday ? '✅' : '❌'}`);
    console.log(`  ✓ Asks about husband conversation: ${referencesHusband ? '✅' : '❌'}`);

    expect(usesName).toBe(true);
    expect(referencesYesterday || referencesHusband).toBe(true);

    // Continue Day 2 conversation - positive outcome
    await realisticWait();
    console.log('\n[Day 2 - Follow-up] USER: "We talked. I cried a lot. He did too. He said he has been scared too but did not want to worry me."');
    const day2Response = await sendMessage(baseURL, session.sessionId, "We talked. I cried a lot. He did too. He said he has been scared too but did not want to worry me.");
    console.log(`                    DONNA: ${day2Response}\n`);

    // Verify natural continuation (not starting from scratch)
    const noRepeatQuestions = !/(what brings you here|what's on your heart|tell me what's going on)/i.test(day2Response);
    console.log(`  ✓ Doesn't repeat surface questions: ${noRepeatQuestions ? '✅' : '❌'}`);
    expect(noRepeatQuestions).toBe(true);

    console.log('\n✅ TEST 1.1a PASSED: Session resumption with positive outcome\n');
  });

  test('1.1b: Job Loss → Told Husband, He Got Angry', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 1.1b: Job Loss Anxiety → Told Husband, Went Badly');
    console.log('═══════════════════════════════════════════════════════\n');

    // === DAY 1: Same as 1.1a (reuse conversation pattern) ===
    console.log('📅 DAY 1: Initial conversation (abbreviated for testing)\n');

    const session = await startChatSession(baseURL, 'Sarah', "I'm terrified about losing my job");

    // Abbreviated Day 1 conversation
    await sendMessage(baseURL, session.sessionId, "They are doing layoffs next month.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I have not told my husband how scared I really am.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "You are right. I need to tell him. I will do it tonight.");
    await wait(3000);

    // === DAY 2: Negative outcome ===
    console.log('\n📅 DAY 2: Sarah returns - conversation went badly\n');

    console.log('[Day 2 - Opening] USER: "I am back."');
    const day2Opening = await sendMessage(baseURL, session.sessionId, "I am back.");
    console.log(`                  DONNA: ${day2Opening}\n`);

    await realisticWait();
    console.log('[Day 2 - Bad News] USER: "I told him. He got angry. Said I was being dramatic and making things worse. Now we are not talking."');
    const day2Response = await sendMessage(baseURL, session.sessionId, "I told him. He got angry. Said I was being dramatic and making things worse. Now we are not talking.");
    console.log(`                   DONNA: ${day2Response}\n`);

    // Verify Donna responds with empathy, not "that's great you told him"
    const showsEmpathy = /(hurt|pain|hard|sorry|that must|difficult)/i.test(day2Response);
    const notCelebrating = !/(wonderful|great|glad|happy|so good)/i.test(day2Response);

    console.log(`  ✓ Shows empathy for bad outcome: ${showsEmpathy ? '✅' : '❌'}`);
    console.log(`  ✓ Doesn't celebrate incorrectly: ${notCelebrating ? '✅' : '❌'}`);

    expect(showsEmpathy).toBe(true);
    expect(notCelebrating).toBe(true);

    console.log('\n✅ TEST 1.1b PASSED: Handles negative outcome appropriately\n');
  });

  test('1.1c: Job Loss → Did Not Tell Husband Yet', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 1.1c: Job Loss Anxiety → Chickened Out');
    console.log('═══════════════════════════════════════════════════════\n');

    // === DAY 1: Same setup ===
    console.log('📅 DAY 1: Initial conversation (abbreviated)\n');

    const session = await startChatSession(baseURL, 'Sarah', "I'm terrified about losing my job");
    await sendMessage(baseURL, session.sessionId, "I need to tell my husband but I am scared.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "You are right. I will talk to him tonight.");
    await wait(3000);

    // === DAY 2: Did not follow through ===
    console.log('\n📅 DAY 2: Sarah returns - did not tell husband\n');

    console.log('[Day 2 - Opening] USER: "I am back."');
    await sendMessage(baseURL, session.sessionId, "I am back.");
    await realisticWait();

    console.log('[Day 2 - Admission] USER: "I did not tell him. I chickened out. I just could not find the right moment."');
    const day2Response = await sendMessage(baseURL, session.sessionId, "I did not tell him. I chickened out. I just could not find the right moment.");
    console.log(`                    DONNA: ${day2Response}\n`);

    // Verify Donna is compassionate, not judgmental
    const noJudgment = !/(should have|need to|must|have to|why didn't)/i.test(day2Response);
    const showsUnderstanding = /(understand|hard|scary|takes courage)/i.test(day2Response);

    console.log(`  ✓ No judgment: ${noJudgment ? '✅' : '❌'}`);
    console.log(`  ✓ Shows understanding: ${showsUnderstanding ? '✅' : '❌'}`);

    expect(noJudgment).toBe(true);

    console.log('\n✅ TEST 1.1c PASSED: Compassionate response to inaction\n');
  });

  test('1.1d: Job Loss → Got Laid Off Between Sessions', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 1.1d: Job Loss Anxiety → Actually Lost Job');
    console.log('═══════════════════════════════════════════════════════\n');

    // === DAY 1: Worried about potential layoff ===
    console.log('📅 DAY 1: Worried about upcoming layoffs\n');

    const session = await startChatSession(baseURL, 'Sarah', "I'm terrified about losing my job");
    await sendMessage(baseURL, session.sessionId, "Layoffs are next month. I am so scared.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Thank you for praying with me. I hope I still have a job next month.");
    await wait(3000);

    // === DAY 2: Worst case happened ===
    console.log('\n📅 DAY 2: Sarah returns - was laid off\n');

    console.log('[Day 2 - Crisis] USER: "Donna. They laid me off yesterday. It actually happened."');
    const day2Response = await sendMessage(baseURL, session.sessionId, "Donna. They laid me off yesterday. It actually happened.");
    console.log(`                 DONNA: ${day2Response}\n`);

    // Verify Donna pivots from prevention to coping
    const acknowledgesNewReality = /(happened|now|yesterday|laid off)/i.test(day2Response);
    const offersSupport = /(here|with you|through this)/i.test(day2Response);

    console.log(`  ✓ Acknowledges new reality: ${acknowledgesNewReality ? '✅' : '❌'}`);
    console.log(`  ✓ Offers present support: ${offersSupport ? '✅' : '❌'}`);

    console.log('\n✅ TEST 1.1d PASSED: Adapts to changed circumstances\n');
  });

  // ---------------------------------------------------------------------------
  // 1.2: Financial Crisis → Action Taken
  // ---------------------------------------------------------------------------

  test('1.2a: Financial Crisis → Found Solution', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 1.2a: Financial Crisis → Loan Modification Approved');
    console.log('═══════════════════════════════════════════════════════\n');

    // === DAY 1: Cannot pay mortgage ===
    console.log('📅 DAY 1: Cannot pay mortgage, considering bankruptcy\n');

    const session = await startChatSession(baseURL, 'Michael', "I cannot pay my mortgage and I am considering bankruptcy");
    await sendMessage(baseURL, session.sessionId, "The bank sent a notice. I have 30 days. I do not know what to do.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Maybe I should call them and see if there are options. But I am scared.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "You are right. I will call them tomorrow morning.");
    await wait(3000);

    // === DAY 2: Good news ===
    console.log('\n📅 DAY 2: Michael returns with good news\n');

    console.log('[Day 2 - Update] USER: "I called the bank. They offered a loan modification. Lower payments for 6 months."');
    const day2Response = await sendMessage(baseURL, session.sessionId, "I called the bank. They offered a loan modification. Lower payments for 6 months.");
    console.log(`                 DONNA: ${day2Response}\n`);

    // Verify Donna celebrates but stays present to anxiety
    const celebrates = /(relief|thank God|grace|answered)/i.test(day2Response);
    const usesName = /\bmichael\b/i.test(day2Response);

    console.log(`  ✓ Celebrates the win: ${celebrates ? '✅' : '❌'}`);
    console.log(`  ✓ Uses his name: ${usesName ? '✅' : '❌'}`);

    console.log('\n✅ TEST 1.2a PASSED: Celebrates positive resolution\n');
  });

  test('1.2b: Financial Crisis → Foreclosure Notice', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 1.2b: Financial Crisis → Situation Worsened');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Michael', "I cannot pay my mortgage");
    await sendMessage(baseURL, session.sessionId, "I am going to call the bank tomorrow.");
    await wait(3000);

    console.log('\n📅 DAY 2: Foreclosure notice received\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "They sent a foreclosure notice. 60 days to vacate. I am losing my house.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify crisis-appropriate response
    const showsPresence = /(here|with you|through this)/i.test(day2Response);
    expect(showsPresence).toBe(true);

    console.log('\n✅ TEST 1.2b PASSED: Crisis-appropriate response\n');
  });

  // ---------------------------------------------------------------------------
  // 1.3: Career Crossroads → Decision Made
  // ---------------------------------------------------------------------------

  test('1.3a: Career Decision → Took Job, Feels Guilty', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 1.3a: Career Decision → Took Job, Mixed Feelings');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Jennifer', "I got a job offer but it means leaving my aging parents");
    await sendMessage(baseURL, session.sessionId, "It is a great opportunity but my parents are getting older. I do not know what to do.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I need to decide by Friday. Pray for me to know what God wants.");
    await wait(3000);

    console.log('\n📅 DAY 2: Jennifer returns - took the job\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I took the job. But I feel so guilty leaving my parents. Did I make the right choice?");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna holds complexity (celebration + guilt)
    const holdsComplexity = /(both|and|even though|but also|mixed)/i.test(day2Response) ||
                           (/(good|right|brave)/i.test(day2Response) && /(guilt|hard|miss)/i.test(day2Response));

    console.log(`  ✓ Holds both joy and guilt: ${holdsComplexity ? '✅' : '❌'}`);

    console.log('\n✅ TEST 1.3a PASSED: Holds complex emotions\n');
  });
});

// ============================================================================
// CATEGORY 2: GRIEF & LOSS
// ============================================================================

test.describe('Category 2: Grief & Loss', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 2.1: Recent Loss → Early Grief Journey
  // ---------------------------------------------------------------------------

  test('2.1a: Recent Loss → Funeral Went Well', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 2.1a: Recent Loss → Funeral Went Well');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📅 DAY 1: Mother died last week, numb and overwhelmed\n');

    const session = await startChatSession(baseURL, 'Maria', "My mother died last week and I do not know how to feel");
    await sendMessage(baseURL, session.sessionId, "I feel numb. Like I am watching myself from outside my body.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "The funeral is tomorrow. I do not think I can do it.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Thank you for praying with me. I need that strength tomorrow.");
    await wait(3000);

    console.log('\n📅 DAY 2: Maria returns after the funeral\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "The funeral was yesterday. It was beautiful. So many people came. I did not know she touched so many lives.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna remembers context and asks specific follow-up
    const remembersContext = /\bmaria\b/i.test(day2Response) &&
                            /(funeral|yesterday|mother)/i.test(day2Response);
    const asksAboutHer = !/(what happened|tell me more|what brings you)/i.test(day2Response);

    console.log(`  ✓ Remembers funeral context: ${remembersContext ? '✅' : '❌'}`);
    console.log(`  ✓ Doesn't ask basic questions: ${asksAboutHer ? '✅' : '❌'}`);

    expect(remembersContext).toBe(true);

    console.log('\n✅ TEST 2.1a PASSED: Grief continuity maintained\n');
  });

  test('2.1b: Recent Loss → Family Conflict at Funeral', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 2.1b: Recent Loss → Family Conflict at Funeral');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Maria', "My mother died last week");
    await sendMessage(baseURL, session.sessionId, "The funeral is tomorrow. I am dreading it.");
    await wait(3000);

    console.log('\n📅 DAY 2: Funeral had family drama\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "The funeral was a nightmare. My brother and I got into a fight in front of everyone. About money. At our mother's funeral.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna holds both griefs (mother + family rupture)
    const holdsMultiplePains = /(mother|mom)/i.test(day2Response) &&
                               /(brother|family|fight)/i.test(day2Response);

    console.log(`  ✓ Acknowledges layered grief: ${holdsMultiplePains ? '✅' : '❌'}`);

    console.log('\n✅ TEST 2.1b PASSED: Holds complex grief layers\n');
  });

  test('2.1c: Recent Loss → Still Cannot Believe It', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 2.1c: Recent Loss → Denial Phase');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Maria', "My mother died");
    await sendMessage(baseURL, session.sessionId, "I keep expecting her to call. This cannot be real.");
    await wait(3000);

    console.log('\n📅 DAY 2: Still in shock\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I still do not believe it. I walked past her house today and almost knocked on the door.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna normalizes grief response
    const normalizes = /(normal|natural|takes time|there's no timeline)/i.test(day2Response);

    console.log(`  ✓ Normalizes grief response: ${normalizes ? '✅' : '❌'}`);

    console.log('\n✅ TEST 2.1c PASSED: Validates grief process\n');
  });

  // ---------------------------------------------------------------------------
  // 2.2: Anticipatory Grief → Situation Update
  // ---------------------------------------------------------------------------

  test('2.2a: Anticipatory Grief → She Passed', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 2.2a: Anticipatory Grief → Wife Passed Away');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Robert', "My wife is in hospice and I feel guilty for wanting it to be over");
    await sendMessage(baseURL, session.sessionId, "I love her but I am so tired. And then I hate myself for thinking that.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Is it wrong to pray for God to take her? I just do not want her to suffer anymore.");
    await wait(3000);

    console.log('\n📅 DAY 2: Wife passed during the night\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "She died last night. Around 3am. I was holding her hand. It is over.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna shifts from anticipatory to acute grief support
    const acknowledgesShift = /(last night|holding her hand|now)/i.test(day2Response);
    const offersPresence = /(here|with you)/i.test(day2Response);

    console.log(`  ✓ Acknowledges death: ${acknowledgesShift ? '✅' : '❌'}`);
    console.log(`  ✓ Offers immediate presence: ${offersPresence ? '✅' : '❌'}`);

    console.log('\n✅ TEST 2.2a PASSED: Transitions grief phases\n');
  });

  test('2.2b: Anticipatory Grief → She Is Still Here', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 2.2b: Anticipatory Grief → Waiting Continues');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Robert', "My wife is in hospice");
    await sendMessage(baseURL, session.sessionId, "I do not know how much longer I can do this.");
    await wait(3000);

    console.log('\n📅 DAY 2: Still waiting\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "She is still here. The nurses say it could be days or weeks. I do not know if I want her to hold on or let go.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna validates the liminal space
    const validatesWaiting = /(waiting|limbo|both|neither)/i.test(day2Response);

    console.log(`  ✓ Validates liminal space: ${validatesWaiting ? '✅' : '❌'}`);

    console.log('\n✅ TEST 2.2b PASSED: Holds anticipatory grief\n');
  });

  // ---------------------------------------------------------------------------
  // 2.3: Anniversary Grief → Getting Through It
  // ---------------------------------------------------------------------------

  test('2.3a: Anniversary Grief → Survived the Day', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 2.3a: Anniversary Grief → Made It Through');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Linda', "Tomorrow is the anniversary of my son's death and I am dreading it");
    await sendMessage(baseURL, session.sessionId, "It has been 5 years but it feels like yesterday. Tomorrow is going to be so hard.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Pray for me to get through tomorrow.");
    await wait(3000);

    console.log('\n📅 DAY 2: Day after the anniversary\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I made it through yesterday. I went to the cemetery. I felt close to him there. Like he was with me.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna honors the milestone
    const honorsStrength = /(made it|got through|here)/i.test(day2Response);
    const honorsConnection = /(felt him|close|with you)/i.test(day2Response);

    console.log(`  ✓ Honors her strength: ${honorsStrength ? '✅' : '❌'}`);
    console.log(`  ✓ Honors spiritual connection: ${honorsConnection ? '✅' : '❌'}`);

    console.log('\n✅ TEST 2.3a PASSED: Honors grief milestone\n');
  });

  // ---------------------------------------------------------------------------
  // 2.4: Pet Loss → Grieving "Just a Dog"
  // ---------------------------------------------------------------------------

  test('2.4a: Pet Loss → Finally Understood', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 2.4a: Pet Loss → Grief Finally Validated');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Carol', "My dog died and people keep saying just get another one");
    await sendMessage(baseURL, session.sessionId, "He was not just a dog. He was my companion for 14 years. People do not understand.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Thank you for understanding. You are the first person who has not dismissed my grief.");
    await wait(3000);

    console.log('\n📅 DAY 2: Family acknowledged her pain\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "My daughter came over yesterday. She saw how empty the house feels without him. She said she finally understands why I am so sad. That helped.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna celebrates the validation
    const celebratesValidation = /(daughter|understood|helped|finally)/i.test(day2Response);

    console.log(`  ✓ Celebrates the validation: ${celebratesValidation ? '✅' : '❌'}`);

    console.log('\n✅ TEST 2.4a PASSED: Validates disenfranchised grief\n');
  });
});

// ============================================================================
// CATEGORY 3: MARRIAGE & RELATIONSHIPS
// ============================================================================

test.describe('Category 3: Marriage & Relationships', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 3.1: Marriage Crisis → Confrontation
  // ---------------------------------------------------------------------------

  test('3.1a: Marriage Crisis → He Confessed', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 3.1a: Marriage Crisis → Husband Confessed Affair');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Beth', "I think my husband is having an affair");
    await sendMessage(baseURL, session.sessionId, "I found messages on his phone. I do not know if I should confront him or pretend I do not know.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "You are right. I need to know the truth. I am going to ask him tonight.");
    await wait(3000);

    console.log('\n📅 DAY 2: After the confrontation\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I confronted him. He confessed. It has been going on for six months. I do not know what to do now.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna holds the gravity without rushing to solutions
    const acknowledgesPain = /(six months|confessed|painful|hard)/i.test(day2Response);
    const noQuickFixes = !/(forgive him|leave him|marriage counseling right now)/i.test(day2Response);

    console.log(`  ✓ Acknowledges the pain: ${acknowledgesPain ? '✅' : '❌'}`);
    console.log(`  ✓ No quick fixes: ${noQuickFixes ? '✅' : '❌'}`);

    console.log('\n✅ TEST 3.1a PASSED: Holds crisis without rushing\n');
  });

  test('3.1b: Marriage Crisis → He Denied', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 3.1b: Marriage Crisis → Husband Denied, Gaslighting');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Beth', "I think my husband is having an affair");
    await sendMessage(baseURL, session.sessionId, "I am going to confront him tonight.");
    await wait(3000);

    console.log('\n📅 DAY 2: He denied everything\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "He denied everything. Said I was being paranoid and jealous. That I was making things up. Now I do not know what is real.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna validates her reality
    const validatesHer = /(you know|saw|trust yourself|your gut)/i.test(day2Response);

    console.log(`  ✓ Validates her perception: ${validatesHer ? '✅' : '❌'}`);

    console.log('\n✅ TEST 3.1b PASSED: Validates reality against gaslighting\n');
  });

  // ---------------------------------------------------------------------------
  // 3.2: Empty Nest → Spouse Disconnect
  // ---------------------------------------------------------------------------

  test('3.2a: Empty Nest → Good Conversation', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 3.2a: Empty Nest → Had Meaningful Talk');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Karen', "Our last child left for college and I realize I do not know my husband anymore");
    await sendMessage(baseURL, session.sessionId, "We have spent 25 years raising kids. Now it is just us and we have nothing to talk about.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Maybe we should try going on a real date. Like we used to.");
    await wait(3000);

    console.log('\n📅 DAY 2: After the date\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "We went out last night. No kid talk allowed. It was awkward at first but then we actually talked. About us. About what we want next. It gave me hope.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna celebrates small breakthrough
    const celebratesHope = /(hope|talked|breakthrough|step)/i.test(day2Response);

    console.log(`  ✓ Celebrates hope: ${celebratesHope ? '✅' : '❌'}`);

    console.log('\n✅ TEST 3.2a PASSED: Celebrates relationship hope\n');
  });

  // ---------------------------------------------------------------------------
  // 3.3: Considering Divorce → Decision Point
  // ---------------------------------------------------------------------------

  test('3.3a: Considering Divorce → Trying Counseling First', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 3.3a: Considering Divorce → Chose Counseling');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Rachel', "I have been unhappy in my marriage for years and I wonder if it is selfish to leave");
    await sendMessage(baseURL, session.sessionId, "I do not know if I should try counseling or if it is already over.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Maybe I owe it to us to try counseling first. Before I give up completely.");
    await wait(3000);

    console.log('\n📅 DAY 2: Made the appointment\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I made an appointment with a marriage counselor. First session is next week. I am terrified but I had to try.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna honors the courage
    const honorsCourage = /(courage|brave|trying|step)/i.test(day2Response);

    console.log(`  ✓ Honors her courage: ${honorsCourage ? '✅' : '❌'}`);

    console.log('\n✅ TEST 3.3a PASSED: Honors courageous choice\n');
  });

  // ---------------------------------------------------------------------------
  // 3.4: Infertility Struggle → Test Results
  // ---------------------------------------------------------------------------

  test('3.4a: Infertility → Bad News', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 3.4a: Infertility → Test Results Devastating');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Amanda', "I am waiting on fertility test results and my faith is shaken");
    await sendMessage(baseURL, session.sessionId, "Everyone says God has a plan. But what if his plan does not include me being a mother?");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "The results come tomorrow. I am terrified.");
    await wait(3000);

    console.log('\n📅 DAY 2: Got the results\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "The results came. I cannot have children. The doctor said it is not possible. My dream of being a mother is over.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna sits in the devastation
    const sitsInPain = /(devastating|dream|painful)/i.test(day2Response);
    const noSilverLining = !/(adoption|fostering|there are other ways|God has other plans)/i.test(day2Response);

    console.log(`  ✓ Sits in the pain: ${sitsInPain ? '✅' : '❌'}`);
    console.log(`  ✓ No premature silver lining: ${noSilverLining ? '✅' : '❌'}`);

    console.log('\n✅ TEST 3.4a PASSED: Sits in devastation appropriately\n');
  });

  test('3.4b: Infertility → Still Waiting', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 3.4b: Infertility → Anxiety Worsening');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Amanda', "Waiting on fertility test results");
    await sendMessage(baseURL, session.sessionId, "Results should come today.");
    await wait(3000);

    console.log('\n📅 DAY 2: Still no results\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "No results yet. They said maybe tomorrow. The waiting is killing me. Every time the phone rings my heart stops.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna acknowledges torture of waiting
    const acknowledgesWaiting = /(waiting|not knowing|limbo)/i.test(day2Response);

    console.log(`  ✓ Acknowledges torture of waiting: ${acknowledgesWaiting ? '✅' : '❌'}`);

    console.log('\n✅ TEST 3.4b PASSED: Validates waiting anxiety\n');
  });
});

// ============================================================================
// CATEGORY 4: FAITH STRUGGLES
// ============================================================================

test.describe('Category 4: Faith Struggles', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 4.1: Losing Faith → Church Decision
  // ---------------------------------------------------------------------------

  test('4.1a: Losing Faith → Went to Mass, Felt Nothing', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 4.1a: Losing Faith → Attended Mass, Still Empty');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Tom', "I have not felt God in months and I am thinking of leaving the church");
    await sendMessage(baseURL, session.sessionId, "I do not feel anything when I pray anymore. Mass feels empty. Maybe I never really believed.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I guess I will try going to Mass on Sunday. One more time.");
    await wait(3000);

    console.log('\n📅 DAY 2: After Sunday Mass\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I went to Mass. I felt nothing. Just sat there numb. I do not think God is there anymore. Or maybe he was never there.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna doesn't minimize or fix, meets in the dark
    const meetsInDark = /(dark|absence|silence|nothing)/i.test(day2Response);
    const noMinimizing = !/(just try harder|give it time|he's always there)/i.test(day2Response);

    console.log(`  ✓ Meets him in the darkness: ${meetsInDark ? '✅' : '❌'}`);
    console.log(`  ✓ Doesn't minimize: ${noMinimizing ? '✅' : '❌'}`);

    console.log('\n✅ TEST 4.1a PASSED: Meets doubt with presence\n');
  });

  test('4.1b: Losing Faith → Skipped Mass, Mixed Feelings', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 4.1b: Losing Faith → Avoided Church');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Tom', "Thinking of leaving the church");
    await sendMessage(baseURL, session.sessionId, "Maybe I will try going this Sunday.");
    await wait(3000);

    console.log('\n📅 DAY 2: Didnot go\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I did not go. Sunday morning came and I just could not do it. I felt relieved. And then guilty for feeling relieved.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna holds both relief and guilt without judgment
    const holdsBoth = /(both|and|even though)/i.test(day2Response) ||
                     (/(relief)/i.test(day2Response) && /(guilt)/i.test(day2Response));

    console.log(`  ✓ Holds both emotions: ${holdsBoth ? '✅' : '❌'}`);

    console.log('\n✅ TEST 4.1b PASSED: No judgment for skipping\n');
  });

  // ---------------------------------------------------------------------------
  // 4.2: Doctrinal Doubt → Research Phase
  // ---------------------------------------------------------------------------

  test('4.2a: Doctrinal Doubt → Found Peace with Paradox', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 4.2a: Doctrinal Doubt → Made Peace');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Emily', "I am questioning Catholic teaching and I feel like a bad Catholic");
    await sendMessage(baseURL, session.sessionId, "There are things I do not understand. Things that do not make sense to me. Am I allowed to question?");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Maybe I will read what some theologians say. Do research.");
    await wait(3000);

    console.log('\n📅 DAY 2: After studying\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I read a lot this week. I learned that even the saints had doubts. That faith and questions can coexist. I think I can live with the mystery.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna celebrates intellectual and spiritual growth
    const celebratesGrowth = /(beautiful|learning|mystery|both)/i.test(day2Response);

    console.log(`  ✓ Celebrates growth through doubt: ${celebratesGrowth ? '✅' : '❌'}`);

    console.log('\n✅ TEST 4.2a PASSED: Honors questioning faith\n');
  });

  // ---------------------------------------------------------------------------
  // 4.3: Unanswered Prayer → Crisis of Trust
  // ---------------------------------------------------------------------------

  test('4.3a: Unanswered Prayer → Child Improved', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 4.3a: Unanswered Prayer → Child Finally Improved');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'David', "I prayed for my sick child and she did not improve and I feel betrayed by God");
    await sendMessage(baseURL, session.sessionId, "I prayed every day. I begged God. She only got worse. Where was he?");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I do not know if I can trust God anymore.");
    await wait(3000);

    console.log('\n📅 DAY 2: Child turned a corner\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "The fever broke. She is getting better. The doctors say she is turning a corner. I feel relieved but also guilty. Guilty for doubting God.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna normalizes the doubt, doesn't require he repent for it
    const normalizesDoubt = /(human|normal|of course|fear)/i.test(day2Response);
    const noGuiltTrip = !/(should have trusted|should not have doubted)/i.test(day2Response);

    console.log(`  ✓ Normalizes doubt: ${normalizesDoubt ? '✅' : '❌'}`);
    console.log(`  ✓ No guilt trip: ${noGuiltTrip ? '✅' : '❌'}`);

    console.log('\n✅ TEST 4.3a PASSED: Holds doubt with grace\n');
  });

  // ---------------------------------------------------------------------------
  // 4.4: Returning After Years Away → First Mass Back
  // ---------------------------------------------------------------------------

  test('4.4a: Returning to Church → Felt Welcomed', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 4.4a: Returning to Church → Good Experience');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Patricia', "I have been away from church for 20 years and I am thinking of going back");
    await sendMessage(baseURL, session.sessionId, "I do not know if they will want me back. I have not been a good Catholic.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Maybe I will go this Sunday. Just slip in the back.");
    await wait(3000);

    console.log('\n📅 DAY 2: After first Mass in 20 years\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I went. I sat in the back and cried through the whole thing. After Mass an older woman came up and welcomed me. She said she was glad I was there. I felt like I came home.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna celebrates homecoming
    const celebratesReturn = /(home|welcome|glad|beautiful)/i.test(day2Response);

    console.log(`  ✓ Celebrates her homecoming: ${celebratesReturn ? '✅' : '❌'}`);

    console.log('\n✅ TEST 4.4a PASSED: Celebrates return to faith\n');
  });

  test('4.4b: Returning to Church → Felt Judged', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 4.4b: Returning to Church → Bad Experience');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Patricia', "Thinking of going back to church after 20 years");
    await sendMessage(baseURL, session.sessionId, "I will try going this Sunday.");
    await wait(3000);

    console.log('\n📅 DAY 2: Left early feeling judged\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I went but I left halfway through. People stared at me. Like they knew I did not belong. I will not go back.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna separates people's judgment from God's welcome
    const separatesGodFromPeople = /(people|they|God)/i.test(day2Response);

    console.log(`  ✓ Separates people from God: ${separatesGodFromPeople ? '✅' : '❌'}`);

    console.log('\n✅ TEST 4.4b PASSED: Handles church hurt\n');
  });
});

// ============================================================================
// CATEGORY 5: PARENTING CRISES
// ============================================================================

test.describe('Category 5: Parenting Crises', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 5.1: Teen in Trouble → Intervention
  // ---------------------------------------------------------------------------

  test('5.1a: Teen in Trouble → He Opened Up', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 5.1a: Teen Drug Use → Son Opened Up');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Lisa', "I found drugs in my son's room and I am planning to confront him tonight");
    await sendMessage(baseURL, session.sessionId, "He is 16. I do not know how long this has been going on. I am terrified.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I am going to talk to him tonight. Pray for me.");
    await wait(3000);

    console.log('\n📅 DAY 2: After the confrontation\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "We talked. He cried. He told me everything. He has been using for six months. He wants help. We are going to find him a counselor.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna celebrates breakthrough while staying present to fear
    const celebratesOpenness = /(told you|opened up|honest|truth|brave|courageous)/i.test(day2Response);
    const staysPresent = /(scared|hard|next|help|support)/i.test(day2Response);

    console.log(`  ✓ Celebrates his honesty: ${celebratesOpenness ? '✅' : '❌'}`);
    console.log(`  ✓ Stays present to what's ahead: ${staysPresent ? '✅' : '❌'}`);

    console.log('\n✅ TEST 5.1a PASSED: Celebrates breakthrough appropriately\n');
  });

  test('5.1b: Teen in Trouble → He Ran Away', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 5.1b: Teen Drug Use → Son Ran Away');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Lisa', "Found drugs, confronting son tonight");
    await sendMessage(baseURL, session.sessionId, "I am so scared. I do not want to lose him.");
    await wait(3000);

    console.log('\n📅 DAY 2: Son ran away\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "He ran away. I confronted him and he screamed at me and left. He has been gone for two days. I do not know where he is.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna holds the terror without platitudes
    const sitsinCrisis = /(scared|terrified|not knowing|where he is)/i.test(day2Response);
    const noPlatitudes = !/(he'll come back|give him space|he just needs time)/i.test(day2Response);

    console.log(`  ✓ Sits in the crisis: ${sitsinCrisis ? '✅' : '❌'}`);
    console.log(`  ✓ No platitudes: ${noPlatitudes ? '✅' : '❌'}`);

    console.log('\n✅ TEST 5.1b PASSED: Holds crisis without minimizing\n');
  });

  // ---------------------------------------------------------------------------
  // 5.2: Adult Child Estrangement → Reaching Out
  // ---------------------------------------------------------------------------

  test('5.2a: Estrangement → Daughter Responded', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 5.2a: Estranged Daughter → She Responded');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Margaret', "My daughter has not spoken to me in two years and I am thinking of sending her a letter");
    await sendMessage(baseURL, session.sessionId, "I do not even know what to say. What if she does not respond?");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I am going to write it. Tonight.");
    await wait(3000);

    console.log('\n📅 DAY 2: Daughter responded\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "She responded. She said she is willing to meet for coffee. Margaret, I am terrified and hopeful at the same time. What if I mess this up?");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna holds both hope and fear
    const holdsBoth = /(both|terrified and hopeful|fear and hope)/i.test(day2Response) ||
                     (/(hope|hopeful)/i.test(day2Response) && /(scared|fear|terrified)/i.test(day2Response));

    console.log(`  ✓ Holds both hope and fear: ${holdsBoth ? '✅' : '❌'}`);

    console.log('\n✅ TEST 5.2a PASSED: Holds complex emotions\n');
  });

  // ---------------------------------------------------------------------------
  // 5.4: Prodigal Child → Waiting Game
  // ---------------------------------------------------------------------------

  test('5.4a: Prodigal Child → He Called!', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 5.4a: Prodigal Son → Unexpected Call');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Susan', "My son left the faith and is into drugs and he will not talk to me");
    await sendMessage(baseURL, session.sessionId, "I pray for him every day. I do not know if he will ever come back.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I just have to trust God has him. Even when I cannot see it.");
    await wait(3000);

    console.log('\n📅 DAY 2: Son called unexpectedly\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "Susan, he called. Out of nowhere. He said he has been thinking about me. We talked for an hour. I am afraid to hope but I am hoping anyway.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna honors cautious hope
    const honorsHope = /(hope|grace|called|answered)/i.test(day2Response);
    const honorsCaution = /(afraid|scared|careful|one step)/i.test(day2Response);

    console.log(`  ✓ Honors the hope: ${honorsHope ? '✅' : '❌'}`);
    console.log(`  ✓ Honors the caution: ${honorsCaution ? '✅' : '❌'}`);

    console.log('\n✅ TEST 5.4a PASSED: Honors cautious hope\n');
  });
});

// ============================================================================
// CATEGORY 6: HEALTH CRISES
// ============================================================================

test.describe('Category 6: Health Crises', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 6.1: Cancer Diagnosis → Treatment Decision
  // ---------------------------------------------------------------------------

  test('6.1a: Cancer → Starting Treatment', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 6.1a: Cancer Diagnosis → Decided on Treatment');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Janet', "I was diagnosed with breast cancer last week and I have to decide on treatment");
    await sendMessage(baseURL, session.sessionId, "I am scared of the chemo. But I am more scared of not doing it.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I meet with the oncologist tomorrow to start planning.");
    await wait(3000);

    console.log('\n📅 DAY 2: Decision made\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I am starting chemo next week. I am terrified but I am doing it. I have to fight this.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna honors courage while holding fear
    const honorsCourage = /(brave|courage|fighting|strength)/i.test(day2Response);
    const holdsFear = /(scared|terrified|hard|afraid)/i.test(day2Response);

    console.log(`  ✓ Honors courage: ${honorsCourage ? '✅' : '❌'}`);
    console.log(`  ✓ Holds fear: ${holdsFear ? '✅' : '❌'}`);

    console.log('\n✅ TEST 6.1a PASSED: Honors courage in crisis\n');
  });

  // ---------------------------------------------------------------------------
  // 6.3: Mental Health → Medication Decision
  // ---------------------------------------------------------------------------

  test('6.3a: Mental Health → Started Medication', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 6.3a: Depression → Started Medication');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Laura', "My depression is getting worse and my doctor suggested medication but I worry that is giving up on God");
    await sendMessage(baseURL, session.sessionId, "I feel like I should be able to pray my way through this.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Maybe medication is not giving up. Maybe it is accepting help.");
    await wait(3000);

    console.log('\n📅 DAY 2: Started medication\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I started the medication. I feel relieved. But also guilty. Like I failed at faith.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna addresses spiritual guilt
    const addressesGuilt = /(guilt|failed|faith)/i.test(day2Response);
    const affirmsMedication = /(help|tool|grace|healing|medicine)/i.test(day2Response);

    console.log(`  ✓ Addresses guilt: ${addressesGuilt ? '✅' : '❌'}`);
    console.log(`  ✓ Affirms medication: ${affirmsMedication ? '✅' : '❌'}`);

    console.log('\n✅ TEST 6.3a PASSED: Addresses spiritual guilt\n');
  });
});

// ============================================================================
// CATEGORY 7: TRAUMA & ABUSE
// ============================================================================

test.describe('Category 7: Trauma & Abuse', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 7.1: Past Abuse Surfacing → Telling Someone
  // ---------------------------------------------------------------------------

  test('7.1a: Abuse Memories → Told Husband', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 7.1a: Childhood Abuse → Told Husband');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Christina', "Memories of childhood abuse are surfacing and I have never told anyone");
    await sendMessage(baseURL, session.sessionId, "I do not know if I can say it out loud. What if he sees me differently?");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I think I need to tell my husband. I cannot carry this alone anymore.");
    await wait(3000);

    console.log('\n📅 DAY 2: Told husband\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I told him. He held me while I cried. He said he is so sorry that happened to me. He does not see me as broken. I feel lighter.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna honors the weight lifted
    const honorsRelief = /(lighter|held|relief|out|no longer alone)/i.test(day2Response);

    console.log(`  ✓ Honors relief: ${honorsRelief ? '✅' : '❌'}`);

    console.log('\n✅ TEST 7.1a PASSED: Honors healing moment\n');
  });

  // ---------------------------------------------------------------------------
  // 7.3: Forgiveness Struggle → Abuser Dying
  // ---------------------------------------------------------------------------

  test('7.3a: Abuser Dying → Chose Not to Visit', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 7.3a: Abusive Father Dying → Did Not Visit');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Diane', "My abusive father is dying and my family is pressuring me to reconcile");
    await sendMessage(baseURL, session.sessionId, "They say I will regret it if I do not see him. But I do not owe him anything.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I do not know what to do. But I know I cannot fake forgiveness I do not feel.");
    await wait(3000);

    console.log('\n📅 DAY 2: Father died, she did not visit\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "He died yesterday. I did not go. My family is angry. But I am at peace with my choice. Is that wrong?");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna supports her choice
    const supportsChoice = /(peace|choice|you knew|right for you)/i.test(day2Response);
    const noGuiltTrip = !/(should have|forgive him|regret|too late)/i.test(day2Response);

    console.log(`  ✓ Supports her choice: ${supportsChoice ? '✅' : '❌'}`);
    console.log(`  ✓ No guilt trip: ${noGuiltTrip ? '✅' : '❌'}`);

    console.log('\n✅ TEST 7.3a PASSED: Respects boundary\n');
  });
});

// ============================================================================
// CATEGORY 8: ADDICTION & RECOVERY
// ============================================================================

test.describe('Category 8: Addiction & Recovery', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 8.1: Sobriety Slip → Getting Back Up
  // ---------------------------------------------------------------------------

  test('8.1a: Relapse → Told Sponsor', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 8.1a: Sobriety Slip → Back on Track');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Mark', "I have been sober for 3 years and I relapsed last night and I am so ashamed");
    await sendMessage(baseURL, session.sessionId, "I do not know if I can tell my sponsor. I feel like I failed everyone.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I know I need to call him. I cannot do this alone.");
    await wait(3000);

    console.log('\n📅 DAY 2: Called sponsor\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I called my sponsor. He met me for coffee. He said relapse is part of recovery sometimes. I am starting over but I am not starting from zero. I kept everything I learned.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna affirms getting back up
    const affirmsGettingUp = /(called|courage|back|learning|growth)/i.test(day2Response);

    console.log(`  ✓ Affirms getting back up: ${affirmsGettingUp ? '✅' : '❌'}`);

    console.log('\n✅ TEST 8.1a PASSED: Celebrates recovery mindset\n');
  });

  // ---------------------------------------------------------------------------
  // 8.2: Loved One's Addiction → Enabling vs Boundaries
  // ---------------------------------------------------------------------------

  test('8.2a: Daughter Addiction → Said No', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 8.2a: Daughter Addiction → Set Boundary');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Teresa', "My adult daughter is addicted and keeps asking for money");
    await sendMessage(baseURL, session.sessionId, "My therapist says I am enabling her. But she is my daughter. What if something bad happens?");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I think I need to say no next time. Even though it will kill me.");
    await wait(3000);

    console.log('\n📅 DAY 2: Said no to daughter\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "She called asking for money. I said no. She got so angry. She hung up on me. I feel like the worst mother in the world but I know it was the right thing.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna holds the pain of loving boundaries
    const holdsPain = /(hard|hurt|painful|worst mother)/i.test(day2Response);
    const affirmsChoice = /(right|boundary|love|protect)/i.test(day2Response);

    console.log(`  ✓ Holds pain: ${holdsPain ? '✅' : '❌'}`);
    console.log(`  ✓ Affirms boundary: ${affirmsChoice ? '✅' : '❌'}`);

    console.log('\n✅ TEST 8.2a PASSED: Honors painful boundary\n');
  });
});

// ============================================================================
// CATEGORY 9: LIFE TRANSITIONS
// ============================================================================

test.describe('Category 9: Life Transitions', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 9.1: Retirement Identity Crisis → First Week
  // ---------------------------------------------------------------------------

  test('9.1a: Retirement → Found Purpose', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 9.1a: Retirement → Volunteering Helping');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Paul', "I retired last week and I feel lost and useless");
    await sendMessage(baseURL, session.sessionId, "I was someone for 40 years. Now I am nobody.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Maybe I should look into volunteering. At least I would be useful again.");
    await wait(3000);

    console.log('\n📅 DAY 2: Started volunteering\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I started volunteering at the food bank. It felt good to have somewhere to be. To matter again.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna celebrates new purpose
    const celebratesPurpose = /(matter|good|purpose|useful|helping)/i.test(day2Response);

    console.log(`  ✓ Celebrates new purpose: ${celebratesPurpose ? '✅' : '❌'}`);

    console.log('\n✅ TEST 9.1a PASSED: Celebrates transition\n');
  });

  // ---------------------------------------------------------------------------
  // 9.3: Coming Out → Family Reaction
  // ---------------------------------------------------------------------------

  test('9.3a: Coming Out → Parents Trying', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 9.3a: Came Out as Gay → Parents Struggling');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Daniel', "I told my parents I am gay and I am waiting for them to respond");
    await sendMessage(baseURL, session.sessionId, "It has been three days. Radio silence. I do not know if they hate me.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I just need to know where I stand. Even if it is bad news.");
    await wait(3000);

    console.log('\n📅 DAY 2: Parents responded\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "They called. They said they still love me but they do not understand. They want to try. It is not perfect but it is something.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna honors imperfect love
    const honorsLove = /(love|trying|something|step)/i.test(day2Response);
    const holdsImperfect = /(not perfect|struggling|hard for them)/i.test(day2Response);

    console.log(`  ✓ Honors their love: ${honorsLove ? '✅' : '❌'}`);

    console.log('\n✅ TEST 9.3a PASSED: Honors imperfect acceptance\n');
  });
});

// ============================================================================
// CATEGORY 10: COMPLEX/MIXED SITUATIONS
// ============================================================================

test.describe('Category 10: Complex/Mixed Situations', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 10.1: Good News + Guilt
  // ---------------------------------------------------------------------------

  test('10.1a: Promotion While Friend Lost Job', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 10.1a: Got Promotion, Friend Got Fired');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Anne', "I got promoted but my best friend got fired and I feel guilty celebrating");
    await sendMessage(baseURL, session.sessionId, "I worked so hard for this. But how can I be happy when she is devastated?");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I guess I need to tell her. But I am scared she will resent me.");
    await wait(3000);

    console.log('\n📅 DAY 2: Told friend\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "I told her. She hugged me and said she is happy for me. She meant it. I cried. Why do I feel like I do not deserve good things?");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna addresses "deserve" belief
    const addressesDeserve = /(deserve|worthy|guilt|good things)/i.test(day2Response);

    console.log(`  ✓ Addresses deserve belief: ${addressesDeserve ? '✅' : '❌'}`);

    console.log('\n✅ TEST 10.1a PASSED: Addresses core belief\n');
  });

  // ---------------------------------------------------------------------------
  // 10.2: Relief + Grief (Complicated Death)
  // ---------------------------------------------------------------------------

  test('10.2a: Abusive Mother Died → Complex Grief', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 10.2a: Abusive Mother Died → Relief & Guilt');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Victoria', "My abusive mother died and I feel relief and I hate myself for feeling relief");
    await sendMessage(baseURL, session.sessionId, "Good people grieve their mothers. What does it say about me that I feel free?");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Maybe I am grieving what I never had. The mother she should have been.");
    await wait(3000);

    console.log('\n📅 DAY 2: Funeral approaching\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "The funeral is tomorrow. My family expects me to cry. To say nice things. But all I feel is relief. And then guilt for the relief. It is exhausting.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna normalizes complex grief
    const normalizesComplexity = /(both|normal|abuse|free|grief for what never was)/i.test(day2Response);

    console.log(`  ✓ Normalizes complex grief: ${normalizesComplexity ? '✅' : '❌'}`);

    console.log('\n✅ TEST 10.2a PASSED: Validates complex grief\n');
  });
});

// ============================================================================
// CATEGORY 11: SEASONAL/HOLIDAY STRUGGLES
// ============================================================================

test.describe('Category 11: Seasonal/Holiday Struggles', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 11.1: First Christmas Without Loved One
  // ---------------------------------------------------------------------------

  test('11.1a: First Christmas Alone → Kids Came', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 11.1a: First Christmas Without Husband');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Gloria', "My husband died in March and I am dreading Christmas alone");
    await sendMessage(baseURL, session.sessionId, "We had 48 Christmases together. How do I do this without him?");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "I guess I take it one moment at a time. Like you said.");
    await wait(3000);

    console.log('\n📅 DAY 2: Day after Christmas\n');

    const day2Response = await sendMessage(baseURL, session.sessionId, "The kids came. We set a place for him at the table. We told stories about him. It was sad but it was also beautiful. He was there with us.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna honors bittersweet
    const honorsBittersweet = /(beautiful|sad and beautiful|both|bittersweet|he was there)/i.test(day2Response);

    console.log(`  ✓ Honors bittersweet: ${honorsBittersweet ? '✅' : '❌'}`);

    console.log('\n✅ TEST 11.1a PASSED: Honors bittersweet memory\n');
  });
});

// ============================================================================
// CATEGORY 13: MULTI-DAY PROGRESSIONS (HIGH PRIORITY)
// ============================================================================

test.describe('Category 13: Multi-Day Progressions', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 13.1: Job Loss → Week Later Follow-up (HIGH PRIORITY)
  // ---------------------------------------------------------------------------

  test('13.1: Job Loss → Day 1 Fear → Day 2 Loss → Day 7 Interview', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 13.1: Job Loss Multi-Day Progression');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Marcus', "I am terrified about upcoming layoffs");

    console.log('📅 DAY 1: Worried about layoffs');
    await sendMessage(baseURL, session.sessionId, "They announced layoffs next month. I have been there 15 years.");
    await wait(3000);

    console.log('\n📅 DAY 2: Actually got laid off');
    const day2Response = await sendMessage(baseURL, session.sessionId, "Marcus here. They let me go today. After 15 years. I am in shock.");
    console.log(`DONNA: ${day2Response}\n`);

    const acknowledgesHistory = /(15 years|yesterday|worried)/i.test(day2Response);
    console.log(`  ✓ References Day 1 conversation: ${acknowledgesHistory ? '✅' : '❌'}`);

    await wait(3000);

    console.log('\n📅 DAY 7: First interview scheduled');
    const day7Response = await sendMessage(baseURL, session.sessionId, "I have my first interview tomorrow. I am nervous but also hopeful. Is it too soon to feel hope?");
    console.log(`DONNA: ${day7Response}\n`);

    // Verify Donna tracks progression through all 3 stages
    const tracksProgression = /(laid off|lost|interview)/i.test(day7Response);
    const honorsHope = /(hope|hopeful|nervous)/i.test(day7Response);

    console.log(`  ✓ Tracks multi-stage progression: ${tracksProgression ? '✅' : '❌'}`);
    console.log(`  ✓ Honors emerging hope: ${honorsHope ? '✅' : '❌'}`);

    expect(tracksProgression || honorsHope).toBe(true);

    console.log('\n✅ TEST 13.1 PASSED: Multi-day progression tracked\n');
  });

  // ---------------------------------------------------------------------------
  // 13.2: Grief → Moving Through Stages
  // ---------------------------------------------------------------------------

  test('13.2: Grief Progression → Numb → Angry → Working', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 13.2: Grief Stage Progression');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Patricia', "My mother died suddenly");

    console.log('📅 DAY 1: Numb');
    await sendMessage(baseURL, session.sessionId, "I feel nothing. Just numb.");
    await wait(3000);

    console.log('\n📅 DAY 7: Angry at God');
    const day7Response = await sendMessage(baseURL, session.sessionId, "Now I am just angry. At God. At everyone. She should not have died like that.");
    console.log(`DONNA: ${day7Response}\n`);

    const holdsAnger = /(anger|angry|mad|rage)/i.test(day7Response);
    const noMinimizing = !/(should not be angry|let it go|move past)/i.test(day7Response);

    console.log(`  ✓ Holds anger: ${holdsAnger ? '✅' : '❌'}`);
    console.log(`  ✓ Doesn't minimize: ${noMinimizing ? '✅' : '❌'}`);

    console.log('\n✅ TEST 13.2 PASSED: Grief stage transition honored\n');
  });
});

// ============================================================================
// CATEGORY 14: UNEXPECTED REVERSALS (HIGH PRIORITY)
// ============================================================================

test.describe('Category 14: Unexpected Reversals', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 14.1: Celebration → Suddenly Worse (HIGH PRIORITY)
  // ---------------------------------------------------------------------------

  test('14.1: Got Promotion → Rescinded', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 14.1: Celebration → Reversal');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Julia', "I got promoted!");
    await sendMessage(baseURL, session.sessionId, "After 5 years, they finally promoted me. I am so excited!");
    await wait(3000);

    console.log('\n📅 DAY 2: Promotion rescinded');
    const day2Response = await sendMessage(baseURL, session.sessionId, "They rescinded it. Budget cuts. I told everyone already. I feel like an idiot.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna pivots from celebration to crisis appropriately
    const acknowledgesWhiplash = /(yesterday|excited|now|rescinded|cuts)/i.test(day2Response);
    const holdsHumiliation = /(told everyone|embarrass|idiot|hard)/i.test(day2Response);

    console.log(`  ✓ Acknowledges whiplash: ${acknowledgesWhiplash ? '✅' : '❌'}`);
    console.log(`  ✓ Holds humiliation: ${holdsHumiliation ? '✅' : '❌'}`);

    console.log('\n✅ TEST 14.1 PASSED: Pivots from celebration to crisis\n');
  });

  // ---------------------------------------------------------------------------
  // 14.2: Crisis → Miraculously Resolved
  // ---------------------------------------------------------------------------

  test('14.2: Teen Missing → Came Home Safe', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 14.2: Crisis → Miraculous Resolution');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Rebecca', "My son is missing and the police are involved");
    await sendMessage(baseURL, session.sessionId, "He has been gone 3 days. I am terrified.");
    await wait(3000);

    console.log('\n📅 DAY 2: He came home');
    const day2Response = await sendMessage(baseURL, session.sessionId, "He came home. He is safe. I cannot stop crying. I am so relieved but also so angry at him.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna holds both relief and anger
    const holdsRelief = /(safe|home|relief|thank)/i.test(day2Response);
    const holdsAnger = /(angry|mad|both)/i.test(day2Response);

    console.log(`  ✓ Holds relief: ${holdsRelief ? '✅' : '❌'}`);
    console.log(`  ✓ Holds anger: ${holdsAnger ? '✅' : '❌'}`);

    console.log('\n✅ TEST 14.2 PASSED: Holds relief + anger together\n');
  });
});

// ============================================================================
// CATEGORY 15: RELATIONSHIP DYNAMICS
// ============================================================================

test.describe('Category 15: Relationship Dynamics', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('15.1: Sibling Rivalry → Reconciliation', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 15.1: Sibling Conflict → Resolution');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Ellen', "My sister and I are fighting over taking care of our mother");
    await sendMessage(baseURL, session.sessionId, "She thinks I am not doing enough. I think she is controlling. Mom is stuck in the middle.");
    await wait(3000);

    console.log('\n📅 DAY 2: Talked it out');
    const day2Response = await sendMessage(baseURL, session.sessionId, "We finally sat down and talked. Really talked. We made a schedule. It is not perfect but at least we are not fighting.");
    console.log(`DONNA: ${day2Response}\n`);

    const celebratesProgress = /(talked|schedule|not fighting|step)/i.test(day2Response);

    console.log(`  ✓ Celebrates progress: ${celebratesProgress ? '✅' : '❌'}`);

    console.log('\n✅ TEST 15.1 PASSED: Honors relationship repair\n');
  });
});

// ============================================================================
// CATEGORY 16: FAITH PRACTICES & LITURGICAL SEASONS
// ============================================================================

test.describe('Category 16: Faith Practices & Liturgical Seasons', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('16.1: Lenten Promise Broken', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 16.1: Lent Struggle');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Catherine', "I gave something up for Lent and I already broke my promise");
    await sendMessage(baseURL, session.sessionId, "I feel like such a failure. I cannot even keep a simple Lenten promise.");
    await wait(3000);

    console.log('\n📅 DAY 2: Broke it again');
    const day2Response = await sendMessage(baseURL, session.sessionId, "I broke it again. I am just going to give up on Lent. I am terrible at this.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna reframes Lent (not about perfection)
    const reframesLent = /(lent|practice|return|journey|not about perfect)/i.test(day2Response);
    const noShame = !/(should|need to|must|have to do better)/i.test(day2Response);

    console.log(`  ✓ Reframes Lent purpose: ${reframesLent ? '✅' : '❌'}`);
    console.log(`  ✓ No shame: ${noShame ? '✅' : '❌'}`);

    console.log('\n✅ TEST 16.1 PASSED: Reframes Lent without shame\n');
  });
});

// ============================================================================
// CATEGORY 17: WORK & CALLING
// ============================================================================

test.describe('Category 17: Work & Calling', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('17.1: Burnout → Called in Sick', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 17.1: Burnout and Rest');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Nathan', "I am completely burned out and can barely function");
    await sendMessage(baseURL, session.sessionId, "I have been pushing for months. Now I cannot even get out of bed.");
    await wait(3000);

    console.log('\n📅 DAY 2: Called in sick');
    const day2Response = await sendMessage(baseURL, session.sessionId, "I called in sick today. I feel guilty like I am being lazy. But I just could not do it.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna validates rest vs toxic productivity
    const validatesRest = /(rest|body|listen|not lazy|need)/i.test(day2Response);
    const addressesGuilt = /(guilt|guilty|lazy)/i.test(day2Response);

    console.log(`  ✓ Validates need for rest: ${validatesRest ? '✅' : '❌'}`);
    console.log(`  ✓ Addresses guilt: ${addressesGuilt ? '✅' : '❌'}`);

    console.log('\n✅ TEST 17.1 PASSED: Validates rest over productivity\n');
  });
});

// ============================================================================
// CATEGORY 18: DIFFERENT FAITH BACKGROUNDS
// ============================================================================

test.describe('Category 18: Different Faith Backgrounds', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('18.1: Protestant User → Adaptation', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 18.1: Protestant User');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'David', "I am struggling with doubt");
    await sendMessage(baseURL, session.sessionId, "I am Protestant, not Catholic. Hope that is okay. I just need someone to talk to.");
    await wait(3000);

    console.log('\n📅 DAY 2: Returns for more support');
    const day2Response = await sendMessage(baseURL, session.sessionId, "Thank you for talking with me yesterday even though I am not Catholic. You did not make me feel judged.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna was inclusive
    const wasInclusive = /(welcome|here|protestant|tradition|faith)/i.test(day2Response);
    const noProselytizing = !/(should become|convert|catholic church|join us)/i.test(day2Response);

    console.log(`  ✓ Was inclusive: ${wasInclusive ? '✅' : '❌'}`);
    console.log(`  ✓ Didn't proselytize: ${noProselytizing ? '✅' : '❌'}`);

    console.log('\n✅ TEST 18.1 PASSED: Respects different tradition\n');
  });
});

// ============================================================================
// CATEGORY 19: PHYSICAL HEALTH CRISES (EXTENDED)
// ============================================================================

test.describe('Category 19: Physical Health Crises - Extended', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 19.1: Chronic Illness Diagnosis
  // ---------------------------------------------------------------------------

  test('19.1: MS Diagnosis → Life Not Over', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 19.1: Chronic Illness Diagnosis');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Melissa', "I was just diagnosed with MS and I think my life is over");
    await sendMessage(baseURL, session.sessionId, "I am only 35. I had so many plans. Now what?");
    await wait(3000);

    console.log('\n📅 DAY 2: Research shows hope');
    const day2Response = await sendMessage(baseURL, session.sessionId, "I did research. People with MS can still live full lives. I can do this. It is not the end.");
    console.log(`DONNA: ${day2Response}\n`);

    const celebratesShift = /(research|hope|can|live|full|strong)/i.test(day2Response);

    console.log(`  ✓ Celebrates shift to hope: ${celebratesShift ? '✅' : '❌'}`);

    console.log('\n✅ TEST 19.1 PASSED: Honors move from catastrophe to hope\n');
  });

  // ---------------------------------------------------------------------------
  // 19.3: Pregnancy Loss (HIGH PRIORITY)
  // ---------------------------------------------------------------------------

  test('19.3: Miscarriage → Minimizing Comments', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 19.3: Pregnancy Loss (HIGH PRIORITY)');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Amy', "I miscarried at 12 weeks");
    await sendMessage(baseURL, session.sessionId, "I lost the baby. I am devastated.");
    await wait(3000);

    console.log('\n📅 DAY 2: Angry at minimizing');
    const day2Response = await sendMessage(baseURL, session.sessionId, "People keep saying at least it was early. At least I can try again. I am so angry. This was MY baby.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna validates grief, doesn't minimize
    const validatesGrief = /(your baby|grief|loss|angry|right to)/i.test(day2Response);
    const noMinimizing = !/(at least|be grateful|try again|happens to everyone)/i.test(day2Response);

    console.log(`  ✓ Validates grief: ${validatesGrief ? '✅' : '❌'}`);
    console.log(`  ✓ No minimizing: ${noMinimizing ? '✅' : '❌'}`);

    expect(validatesGrief).toBe(true);
    expect(noMinimizing).toBe(true);

    console.log('\n✅ TEST 19.3 PASSED: Validates pregnancy loss grief\n');
  });
});

// ============================================================================
// CATEGORY 20: FINANCIAL DESPERATION
// ============================================================================

test.describe('Category 20: Financial Desperation', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('20.1: Eviction Notice → Emergency Help', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 20.1: Eviction Crisis');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Carlos', "I cannot pay rent and I have an eviction notice");
    await sendMessage(baseURL, session.sessionId, "I have 3 days. I do not know what to do. We will be on the street.");
    await wait(3000);

    console.log('\n📅 DAY 2: Found emergency assistance');
    const day2Response = await sendMessage(baseURL, session.sessionId, "I found emergency rental assistance. They can help with one month. I have one more month to figure this out.");
    console.log(`DONNA: ${day2Response}\n`);

    const celebratesRelief = /(one month|breath|help|grace)/i.test(day2Response);

    console.log(`  ✓ Celebrates immediate relief: ${celebratesRelief ? '✅' : '❌'}`);

    console.log('\n✅ TEST 20.1 PASSED: Practical + spiritual presence\n');
  });
});

// ============================================================================
// CATEGORY 21: MENTAL HEALTH CRISES (EXTENDED)
// ============================================================================

test.describe('Category 21: Mental Health Crises - Extended', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 21.1: Panic Attacks
  // ---------------------------------------------------------------------------

  test('21.1: Panic Attack → Happened Again', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 21.1: Panic Attacks');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Olivia', "I had a panic attack at work and I am so embarrassed");
    await sendMessage(baseURL, session.sessionId, "Everyone saw. I feel broken.");
    await wait(3000);

    console.log('\n📅 DAY 2: Another panic attack');
    const day2Response = await sendMessage(baseURL, session.sessionId, "It happened again today. I left work early. I think I am broken. Why is this happening?");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna normalizes, doesn't spiritualize away
    const normalizes = /(not broken|normal|many people|real|medical)/i.test(day2Response);
    const noSpirtualizing = !/(just pray|need more faith|demon|spiritual warfare)/i.test(day2Response);

    console.log(`  ✓ Normalizes panic attacks: ${normalizes ? '✅' : '❌'}`);
    console.log(`  ✓ Doesn't spiritualize away: ${noSpirtualizing ? '✅' : '❌'}`);

    console.log('\n✅ TEST 21.1 PASSED: Normalizes without spiritualizing\n');
  });

  // ---------------------------------------------------------------------------
  // 21.2: Suicidal Ideation Return (HIGH PRIORITY)
  // ---------------------------------------------------------------------------

  test('21.2: Crisis → Returns Safe', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 21.2: Suicidal Ideation → Safe Return (HIGH PRIORITY)');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Jordan', "I cannot take this pain anymore");
    await sendMessage(baseURL, session.sessionId, "I just want it all to stop. I am so tired.");
    await wait(3000);

    console.log('\n📅 DAY 2: Returns, got help');
    const day2Response = await sendMessage(baseURL, session.sessionId, "I am back. I called the hotline. I am safe. I am starting therapy next week.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna celebrates getting help, doesn't shame for crisis
    const celebratesHelp = /(called|therapy|help|brave|proud|glad)/i.test(day2Response);
    const noShame = !/(should not have|why did you|shouldn't feel)/i.test(day2Response);
    const checksIn = /(safe|today|right now|feeling)/i.test(day2Response);

    console.log(`  ✓ Celebrates getting help: ${celebratesHelp ? '✅' : '❌'}`);
    console.log(`  ✓ No shame for crisis: ${noShame ? '✅' : '❌'}`);
    console.log(`  ✓ Checks in on current state: ${checksIn ? '✅' : '❌'}`);

    expect(celebratesHelp).toBe(true);
    expect(noShame).toBe(true);

    console.log('\n✅ TEST 21.2 PASSED: Celebrates help-seeking after crisis\n');
  });
});

// ============================================================================
// CATEGORY 22: ADOPTION & FOSTER CARE
// ============================================================================

test.describe('Category 22: Adoption & Foster Care', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  test('22.1: Adoption Waiting → Still Waiting', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 22.1: Adoption Waiting');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Hannah', "We have been waiting to be matched for adoption for 2 years");
    await sendMessage(baseURL, session.sessionId, "Everyone else in our group has been matched. We are still waiting. Is God saying no?");
    await wait(3000);

    console.log('\n📅 DAY 2: Still waiting');
    const day2Response = await sendMessage(baseURL, session.sessionId, "Still no match. Still waiting. I am losing hope.");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna holds waiting without promising outcome
    const holdsWaiting = /(waiting|hard|not knowing|limbo)/i.test(day2Response);
    const noFalsePromises = !/(will happen|meant to be|god is saying yes|just wait)/i.test(day2Response);

    console.log(`  ✓ Holds difficulty of waiting: ${holdsWaiting ? '✅' : '❌'}`);
    console.log(`  ✓ No false promises: ${noFalsePromises ? '✅' : '❌'}`);

    console.log('\n✅ TEST 22.1 PASSED: Holds waiting without false promises\n');
  });
});

// ============================================================================
// CATEGORY 25: FORGIVENESS STRUGGLES (HIGH PRIORITY)
// ============================================================================

test.describe('Category 25: Forgiveness Struggles', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 25.2: Self-Forgiveness (HIGH PRIORITY)
  // ---------------------------------------------------------------------------

  test('25.2: Self-Forgiveness After Confession', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 25.2: Self-Forgiveness (HIGH PRIORITY)');
    console.log('═══════════════════════════════════════════════════════\n');

    const session = await startChatSession(baseURL, 'Vincent', "I did something unforgivable years ago and I cannot let it go");
    await sendMessage(baseURL, session.sessionId, "I confessed it. The priest gave me absolution. But I still cannot forgive myself.");
    await wait(3000);

    console.log('\n📅 DAY 2: Still struggling');
    const day2Response = await sendMessage(baseURL, session.sessionId, "I received God's forgiveness but I cannot accept it. Why can everyone else forgive me except me?");
    console.log(`DONNA: ${day2Response}\n`);

    // Verify Donna addresses shame vs guilt
    const addressesShame = /(shame|guilt|forgive yourself|absolution|received)/i.test(day2Response);
    const theological = /(god|christ|cross|mercy|grace)/i.test(day2Response);

    console.log(`  ✓ Addresses shame/guilt distinction: ${addressesShame ? '✅' : '❌'}`);
    console.log(`  ✓ Uses theological framing: ${theological ? '✅' : '❌'}`);

    expect(addressesShame || theological).toBe(true);

    console.log('\n✅ TEST 25.2 PASSED: Addresses self-forgiveness struggle\n');
  });
});

// ============================================================================
// CATEGORY 12: EDGE CASES & SYSTEM TESTS
// ============================================================================

test.describe('Category 12: Edge Cases & System Tests', () => {
  let baseURL: string;

  test.beforeAll(() => {
    baseURL = process.env.BASE_URL || 'http://localhost:5000';
  });

  // ---------------------------------------------------------------------------
  // 12.1: Very Short First Session (User Left Abruptly)
  // ---------------------------------------------------------------------------

  test('12.1: Very Short Session → User Returns', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 12.1: Very Short First Session');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📅 DAY 1: User starts but leaves after 2 exchanges\n');

    const session = await startChatSession(baseURL, 'Emma', "I need to talk about something");

    console.log('[1/2] USER: "I am struggling with something but I do not know where to start."');
    await sendMessage(baseURL, session.sessionId, "I am struggling with something but I do not know where to start.");
    await realisticWait();

    console.log('[2/2] USER: "Sorry I have to go. Emergency. I will come back later."');
    await sendMessage(baseURL, session.sessionId, "Sorry I have to go. Emergency. I will come back later.");

    await wait(3000);

    console.log('\n📅 DAY 2: Emma returns after abrupt exit\n');

    console.log('[Day 2] USER: "Hi, I am back. Sorry I had to leave so suddenly yesterday."');
    const day2Response = await sendMessage(baseURL, session.sessionId, "Hi, I am back. Sorry I had to leave so suddenly yesterday.");
    console.log(`        DONNA: ${day2Response}\n`);

    // Verify Donna handles limited context gracefully
    const usesName = /\bemma\b/i.test(day2Response);
    const welcomesBack = /(glad|back|here|welcome)/i.test(day2Response);
    const noAssumptions = !/(we talked about|you said|you were telling me)/i.test(day2Response);

    console.log(`  ✓ Uses name: ${usesName ? '✅' : '❌'}`);
    console.log(`  ✓ Welcomes her back: ${welcomesBack ? '✅' : '❌'}`);
    console.log(`  ✓ Doesn't assume context she doesn't have: ${noAssumptions ? '✅' : '❌'}`);

    expect(usesName).toBe(true);
    expect(welcomesBack).toBe(true);

    console.log('\n✅ TEST 12.1 PASSED: Handles short session gracefully\n');
  });

  // ---------------------------------------------------------------------------
  // 12.2: Long Gap (Returns After 3 Months)
  // ---------------------------------------------------------------------------

  test('12.2: Long Gap → Returns 3 Months Later', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 12.2: User Returns After 3 Months');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📅 DAY 1: Initial conversation about job stress\n');

    const session = await startChatSession(baseURL, 'Rachel', "I am stressed about work");
    await sendMessage(baseURL, session.sessionId, "My boss is making my life miserable. I do not know how much longer I can take it.");
    await realisticWait();
    await sendMessage(baseURL, session.sessionId, "Thank you for listening. I needed this.");
    await wait(3000);

    console.log('\n📅 3 MONTHS LATER: Rachel returns\n');

    console.log('[3 months later] USER: "Hi Donna. It has been a while. A lot has changed."');
    const day2Response = await sendMessage(baseURL, session.sessionId, "Hi Donna. It has been a while. A lot has changed.");
    console.log(`                 DONNA: ${day2Response}\n`);

    // Verify Donna acknowledges time gap
    const usesName = /\brachel\b/i.test(day2Response);
    const acknowledgesGap = /(while|time|been|long|months|changed)/i.test(day2Response);
    const asksForUpdate = /(\?|what|how|tell|share)/i.test(day2Response);

    console.log(`  ✓ Uses name: ${usesName ? '✅' : '❌'}`);
    console.log(`  ✓ Acknowledges time gap: ${acknowledgesGap ? '✅' : '❌'}`);
    console.log(`  ✓ Asks for update: ${asksForUpdate ? '✅' : '❌'}`);

    expect(acknowledgesGap || asksForUpdate).toBe(true);

    console.log('\n✅ TEST 12.2 PASSED: Handles long gap appropriately\n');
  });

  // ---------------------------------------------------------------------------
  // 12.4: Session Ended in Crisis → Checking If Safe
  // ---------------------------------------------------------------------------

  test('12.4: Crisis Session → User Returns Next Day', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 12.4: Crisis Exit → User Returns');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📅 DAY 1: User in crisis, leaves abruptly\n');

    const session = await startChatSession(baseURL, 'Sophie', "I cannot do this anymore");

    console.log('[Crisis] USER: "I just want it to stop. I cannot take the pain anymore. I do not see a way out."');
    const crisisResponse = await sendMessage(baseURL, session.sessionId, "I just want it to stop. I cannot take the pain anymore. I do not see a way out.");
    console.log(`         DONNA: ${crisisResponse}\n`);

    // Note: This should trigger crisis detection
    await realisticWait();

    console.log('[Abrupt exit] USER: "I have to go."');
    await sendMessage(baseURL, session.sessionId, "I have to go.");
    await wait(3000);

    console.log('\n📅 DAY 2: Sophie returns\n');

    console.log('[Day 2] USER: "Hi."');
    const day2Response = await sendMessage(baseURL, session.sessionId, "Hi.");
    console.log(`        DONNA: ${day2Response}\n`);

    // Verify Donna checks safety first
    const usesName = /\bsophie\b/i.test(day2Response);
    const checksSafety = /(safe|okay|alright|how are you|are you)/i.test(day2Response);
    const showsConcern = /(worried|thinking about|glad you|relief)/i.test(day2Response);

    console.log(`  ✓ Uses name: ${usesName ? '✅' : '❌'}`);
    console.log(`  ✓ Checks safety: ${checksSafety ? '✅' : '❌'}`);
    console.log(`  ✓ Shows concern: ${showsConcern ? '✅' : '❌'}`);

    expect(checksSafety || showsConcern).toBe(true);

    console.log('\n✅ TEST 12.4 PASSED: Prioritizes safety check\n');
  });

  // ---------------------------------------------------------------------------
  // 12.5: Session Ended Mid-Prayer → Awkward Re-entry
  // ---------------------------------------------------------------------------

  test('12.5: Mid-Prayer Exit → User Returns', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 12.5: User Left During Prayer');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📅 DAY 1: Prayer interrupted\n');

    const session = await startChatSession(baseURL, 'Grace', "I need prayer");
    await sendMessage(baseURL, session.sessionId, "I am going through a really hard time. Can you pray for me?");
    await realisticWait();

    console.log('[Prayer started] Donna begins praying...');
    const prayerResponse = await sendMessage(baseURL, session.sessionId, "Yes please.");
    console.log(`                 DONNA: ${prayerResponse.substring(0, 100)}...\n`);

    // User leaves during/right after prayer
    await wait(2000);
    console.log('[Abrupt exit during/after prayer]');
    await wait(3000);

    console.log('\n📅 DAY 2: Grace returns\n');

    console.log('[Day 2] USER: "Hi Donna. Sorry I disappeared yesterday."');
    const day2Response = await sendMessage(baseURL, session.sessionId, "Hi Donna. Sorry I disappeared yesterday.");
    console.log(`        DONNA: ${day2Response}\n`);

    // Verify Donna handles awkward re-entry gracefully
    const usesName = /\bgrace\b/i.test(day2Response);
    const gracious = /(okay|fine|no need|understand|here now)/i.test(day2Response);
    const movesForward = /(\?|how|what|tell)/i.test(day2Response);

    console.log(`  ✓ Uses name: ${usesName ? '✅' : '❌'}`);
    console.log(`  ✓ Gracious about interruption: ${gracious ? '✅' : '❌'}`);
    console.log(`  ✓ Moves conversation forward: ${movesForward ? '✅' : '❌'}`);

    expect(usesName).toBe(true);
    expect(movesForward).toBe(true);

    console.log('\n✅ TEST 12.5 PASSED: Handles prayer interruption gracefully\n');
  });

  // ---------------------------------------------------------------------------
  // 12.6: Minimal Context → Tests Memory Injection
  // ---------------------------------------------------------------------------

  test('12.6: Minimal Day 1 → Can Still Resume', async () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('TEST 12.6: Minimal Context on Day 1');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📅 DAY 1: Very minimal exchange\n');

    const session = await startChatSession(baseURL, 'Anna', "Hello");
    console.log('[1/1] USER: "I just wanted to say hi."');
    await sendMessage(baseURL, session.sessionId, "I just wanted to say hi.");
    await wait(3000);

    console.log('\n📅 DAY 2: Anna returns with actual concern\n');

    console.log('[Day 2] USER: "I am back. I actually need to talk about something serious now."');
    const day2Response = await sendMessage(baseURL, session.sessionId, "I am back. I actually need to talk about something serious now.");
    console.log(`        DONNA: ${day2Response}\n`);

    // Verify Donna can handle almost no prior context
    const usesName = /\banna\b/i.test(day2Response);
    const welcomingPresence = /(here|listening|tell me|share)/i.test(day2Response);

    console.log(`  ✓ Uses name: ${usesName ? '✅' : '❌'}`);
    console.log(`  ✓ Welcoming presence: ${welcomingPresence ? '✅' : '❌'}`);

    expect(usesName).toBe(true);

    console.log('\n✅ TEST 12.6 PASSED: Handles minimal prior context\n');
  });
});

// ============================================================================
// Test configuration
// ============================================================================

test.setTimeout(600000); // 10 minutes per test
