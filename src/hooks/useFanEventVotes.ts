import { useState, useCallback, useEffect } from 'react';
import { getSeasonItem, setSeasonItem } from '../lib/webtoonProgress';
import type { FanEventVotesState } from '../content/fanEvents';

const VOTES_STORAGE_KEY = 'hero_fan_event_votes';

function loadVotes(season: string): FanEventVotesState {
  const raw = getSeasonItem(VOTES_STORAGE_KEY, season);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through
    }
  }
  return {};
}

function saveVotes(season: string, votes: FanEventVotesState): void {
  setSeasonItem(VOTES_STORAGE_KEY, season, JSON.stringify(votes));
}

export interface UseFanEventVotesReturn {
  votes: FanEventVotesState;
  hasVoted: (eventId: string) => boolean;
  getVote: (eventId: string) => string | null;
  castVote: (eventId: string, optionId: string) => boolean;
}

export function useFanEventVotes(season: string): UseFanEventVotesReturn {
  const [votes, setVotes] = useState<FanEventVotesState>(() => loadVotes(season));

  useEffect(() => {
    saveVotes(season, votes);
  }, [votes, season]);

  const hasVoted = useCallback(
    (eventId: string) => {
      return eventId in votes;
    },
    [votes],
  );

  const getVote = useCallback(
    (eventId: string) => {
      return votes[eventId] ?? null;
    },
    [votes],
  );

  const castVote = useCallback(
    (eventId: string, optionId: string): boolean => {
      setVotes(prev => ({ ...prev, [eventId]: optionId }));
      return true;
    },
    [],
  );

  return { votes, hasVoted, getVote, castVote };
}
