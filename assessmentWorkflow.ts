import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  try {
    const docRef = await addDoc(collection(db, 'assessmentPairs'), {
      topicId,
      createdMs: Date.now(),
      preScore,
      preTotal,
      status: 'started',
      timestamp: serverTimestamp()
    });
    sessionStorage.setItem(`amr_pair_doc_${topicId}`, docRef.id);
    return docRef.id;
  } catch (err) {
    console.warn('Learning analytics write skipped (safe offline mode):', err);
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
  const docId = sessionStorage.getItem(`amr_pair_doc_${topicId}`);
  if (!docId) return false;

  const scoreDelta = postScore - preScore;
  const improved = postScore > preScore;

  try {
    await updateDoc(doc(db, 'assessmentPairs', docId), {
      postScore,
      postTotal,
      scoreDelta,
      improved,
      completedMs: Date.now(),
      status: 'completed',
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.warn('Learning analytics update skipped:', err);
    return false;
  }
}

export async function logLearningEvent(
  eventType: 'lesson_start' | 'lesson_complete' | 'quiz_start' | 'quiz_complete',
  topicId: string
) {
  if (!configured || !db) return;
  try {
    await addDoc(collection(db, 'learningAnalytics'), {
      eventType,
      topicId,
      createdMs: Date.now(),
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.warn('Analytics event skipped:', e);
  }
}
