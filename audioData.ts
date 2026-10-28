// Backward compatibility re-export for audioData
import { LISTEN_TOPICS, ListenTopic, AudioParagraph } from './listenData';

export * from './listenData';
export const AUDIO_TOPICS: ListenTopic[] = LISTEN_TOPICS;
export type AudioTopic = ListenTopic;
export type { AudioParagraph };
