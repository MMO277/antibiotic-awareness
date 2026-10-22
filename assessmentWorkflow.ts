import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, configured } from './firebase';

const SESSION_KEY = 'amr_anonymous_learning_session_id';

export function getOrCreateSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = 's_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function markTopicStartedLocally(topicId: string): boolean {
  const key = `amr_started_${topicId}`;
  if (sessionStorage.getItem(key)) {
    return false;
  }
  sessionStorage.setItem(key, '1');
  return true;
}

export function markTopicCompletedLocally(topicId: string): boolean {
  const key = `amr_completed_${topicId}`;
  if (sessionStorage.getItem(key)) {
    return false;
  }
  sessionStorage.setItem(key, '1');
  return true;
}

export interface PairedAssessmentRecord {
  pairId?: string;
  topicId: string;
  createdMs: number;
  completedMs?: number;
  preScore: number;
  preTotal: number;
  postScore?: number;
  postTotal?: number;
  scoreDelta?: number;
  improved?: boolean;
  status: 'started' | 'completed' | 'abandoned';
}

export async function recordPreAssessment(
  topicId: string,
  preScore: number,
  preTotal: number
): Promise<string | null> {
  if (!configured || !db) return null;
  const pairKey = `${getOrCreateSessionId()}_${topicId}`;
  sessionStorage.setItem(`amr_pair_key_${topicId}`, pairKey);
  sessionStorage.setItem(`amr_pre_score_${topicId}`, String(preScore));

  try {
    const docRef = await addDoc(collection(db, 'surveyResponses'), {
      createdMs: Date.now(),
      phase: 'pre',
      age: 0,
      answers: {
        _recordType: 'learning_analytics',
        kind: 'pre_assessment',
        pairKey,
        topicId,
        preScore,
        preTotal
      },
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    console.warn('Learning analytics write skipped:', err);
    return null;
  }
}

export async function recordPostAssessment(
  topicId: string,
  postScore: number,
  postTotal: number,
  preScore: number
): Promise<boolean> {
  if (!configured || !db) return false;
  const pairKey = sessionStorage.getItem(`amr_pair_key_${topicId}`) || `${getOrCreateSessionId()}_${topicId}`;
  const storedPre = sessionStorage.getItem(`amr_pre_score_${topicId}`);
  const effectivePre = storedPre !== null ? Number(storedPre) : preScore;
  const scoreDelta = postScore - effectivePre;
  const improved = postScore > effectivePre;

  try {
    await addDoc(collection(db, 'surveyResponses'), {
      createdMs: Date.now(),
      phase: 'post',
      age: 0,
      answers: {
        _recordType: 'learning_analytics',
        kind: 'post_assessment',
        pairKey,
        topicId,
        preScore: effectivePre,
        preTotal: postTotal,
        postScore,
        postTotal,
        scoreDelta,
        improved
      },
      timestamp: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.warn('Learning analytics post write skipped:', err);
    return false;
  }
}

export async function logLearningEvent(
  eventType: 'lesson_start' | 'lesson_complete' | 'quiz_start' | 'quiz_complete',
  topicId: string
) {
  if (!configured || !db) return;
  try {
    await addDoc(collection(db, 'surveyResponses'), {
      createdMs: Date.now(),
      phase: eventType.includes('complete') ? 'post' : 'pre',
      age: 0,
      answers: {
        _recordType: 'learning_analytics',
        kind: 'event',
        eventType,
        topicId,
        sessionId: getOrCreateSessionId()
      },
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.warn('Analytics event skipped:', e);
  }
}
