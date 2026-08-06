import { useState, useEffect, useCallback } from 'react';
import { translateText } from '../lib/i18n';
import { Language } from '../types';
import { doc, getDoc, setDoc } from '../lib/firebaseMock';
import { db } from '../lib/firebase';

const DEBUG = false;

export interface Market {
  id: string;
  question: string;
  outcomes: string[];
  outcomePrices: number[];
  image?: string;
  liveUrl?: string;
  startDateTime?: string;
  category?: string;
  subCategory: string; // 'Soccer' | 'Baseball' | 'Basketball' | 'NFL' | 'MMA' | 'Politics' | 'Other'
  volume?: number;
  endDate: string;
}

export interface PredictionBet {
  betId: string; // unique ID for this specific bet
  marketId: string;
  question: string;
  outcome: 'Yes' | 'No';
  amount: number;
  betPrice: number; // probability at the time of bet (e.g. 0.6)
  status: 'pending' | 'win' | 'loss' | 'claimed';
  timestamp: number;
  resolvedOutcome?: 'Yes' | 'No';
  isEventBet?: boolean;
}

const parseArray = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
};

// Helper to parse American Odds (e.g. "-150", "+130") to implied probability
const parseAmericanOdds = (oddsStr: any): number => {
  if (oddsStr === undefined || oddsStr === null) return 0.5;
  const str = String(oddsStr).replace('+', '').trim();
  const val = parseInt(str, 10);
  if (isNaN(val) || val === 0) return 0.5;
  if (val < 0) {
    return Math.abs(val) / (Math.abs(val) + 100);
  } else {
    return 100 / (val + 100);
  }
};

// Sports Sub-Category classification helper
const getSubCategory = (categoryStr: string, questionStr: string): string => {
  const category = categoryStr.toLowerCase();
  const question = questionStr.toLowerCase();
  
  if (
    category.includes('politics') ||
    category.includes('election') ||
    question.includes('election') ||
    question.includes('vote') ||
    question.includes('voter') ||
    question.includes('presidential')
  ) {
    return 'Politics';
  }
  
  if (
    category.includes('baseball') || 
    question.includes('baseball') || 
    category.includes('mlb') || 
    question.includes('mlb') || 
    question.includes('wbc') ||
    question.includes('yankees') ||
    question.includes('dodgers') ||
    question.includes('red sox')
  ) {
    return 'Baseball';
  }
  
  if (category.includes('nba') || question.includes('nba') || category.includes('basketball') || question.includes('basketball')) {
    return 'Basketball';
  }
  
  if (
    category.includes('soccer') || 
    question.includes('soccer') || 
    category.includes('la liga') || 
    category.includes('bundesliga') || 
    category.includes('premier league') || 
    category.includes('champions league') ||
    question.includes('premier league') ||
    question.includes('champions league') ||
    question.includes('la liga') ||
    question.includes('bundesliga') ||
    category.includes('world cup') ||
    category.includes('nations league') ||
    category.includes('copa america') ||
    category.includes('euro') ||
    category.includes('gold cup') ||
    category.includes('fifa') ||
    category.includes('uefa') ||
    (question.includes('football') && (
      question.includes('fc') || 
      question.includes('united') || 
      question.includes('real madrid') || 
      question.includes('barcelona') ||
      question.includes('chelsea') ||
      question.includes('arsenal') ||
      question.includes('vs')
    ))
  ) {
    if (question.includes('nfl') || question.includes('super bowl') || category.includes('nfl')) {
      return 'NFL';
    }
    return 'Soccer';
  }
  
  if (category.includes('nfl') || question.includes('nfl') || category.includes('football') || question.includes('football') || question.includes('super bowl')) {
    return 'NFL';
  }
  
  if (category.includes('mma') || category.includes('ufc') || question.includes('ufc') || question.includes('mma') || category.includes('boxing') || question.includes('boxing')) {
    return 'MMA';
  }
  
  return 'Other';
};

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get date range YYYYMMDD-YYYYMMDD for today and tomorrow
const getDatesRangeString = () => {
  const d = new Date();
  const y1 = d.getFullYear();
  const m1 = String(d.getMonth() + 1).padStart(2, '0');
  const d1 = String(d.getDate()).padStart(2, '0');
  const todayStr = `${y1}${m1}${d1}`;

  const tomorrow = new Date(d.getTime() + 86400000);
  const y2 = tomorrow.getFullYear();
  const m2 = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d2 = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${y2}${m2}${d2}`;

  return `${todayStr}-${tomorrowStr}`;
};

// Virtual sports matches fallback (Omit endDate to assign dynamically)
const VIRTUAL_SPORTS_MARKETS: Omit<Market, 'endDate'>[] = [
  {
    id: 'virtual_sports_1',
    question: 'Will Real Madrid win their next UEFA Champions League Match?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.65, 0.35],
    category: 'Sports',
    subCategory: 'Soccer',
    volume: 50000
  },
  {
    id: 'virtual_sports_2',
    question: 'Will Los Angeles Lakers win their upcoming NBA game?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.55, 0.45],
    category: 'Sports',
    subCategory: 'Basketball',
    volume: 45000
  },
  {
    id: 'virtual_sports_3',
    question: 'Will Manchester City defeat Arsenal in their Premier League clash?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.58, 0.42],
    category: 'Sports',
    subCategory: 'Soccer',
    volume: 48000
  },
  {
    id: 'virtual_sports_4',
    question: 'Will Golden State Warriors make it to the NBA Conference Finals?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.48, 0.52],
    category: 'Sports',
    subCategory: 'Basketball',
    volume: 38000
  },
  {
    id: 'virtual_sports_5',
    question: 'Will Rafael Nadal win his next French Open singles match?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.70, 0.30],
    category: 'Sports',
    subCategory: 'Other',
    volume: 32000
  },
  {
    id: 'virtual_sports_6',
    question: 'Will Kansas City Chiefs win the upcoming NFL match?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.62, 0.38],
    category: 'Sports',
    subCategory: 'NFL',
    volume: 42000
  },
  {
    id: 'virtual_sports_7',
    question: 'Will Ferrari win the next Formula 1 Grand Prix?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.40, 0.60],
    category: 'Sports',
    subCategory: 'Other',
    volume: 25000
  },
  {
    id: 'virtual_sports_8',
    question: 'Will Inter Miami win their next MLS League match?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.60, 0.40],
    category: 'Sports',
    subCategory: 'Soccer',
    volume: 30000
  },
  {
    id: 'virtual_sports_9',
    question: 'Will Korea Republic win their next football international match?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.68, 0.32],
    category: 'Sports',
    subCategory: 'Soccer',
    volume: 35000
  },
  {
    id: 'virtual_sports_10',
    question: 'Will Japan win the next World Baseball Classic title match?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.52, 0.48],
    category: 'Sports',
    subCategory: 'Baseball',
    volume: 28000
  },
  {
    id: 'virtual_politics_1',
    question: 'Will the next South Korean presidential election voter turnout exceed 77%?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.55, 0.45],
    category: 'Politics',
    subCategory: 'Politics',
    volume: 62000
  },
  {
    id: 'virtual_politics_2',
    question: 'Will the next South Korean national assembly election voter turnout exceed 65%?',
    outcomes: ['Yes', 'No'],
    outcomePrices: [0.60, 0.40],
    category: 'Politics',
    subCategory: 'Politics',
    volume: 48000
  }
];

const getVirtualMarketsWithToday = (): Market[] => {
  const today = getTodayString();
  return VIRTUAL_SPORTS_MARKETS.map(m => ({
    ...m,
    endDate: today
  }));
};

export const usePredictionMarkets = (currentSeason: string, language: Language) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [bets, setBets] = useState<PredictionBet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `hero_prediction_bets_${currentSeason}`;

  // Load bets from localStorage
  useEffect(() => {
    const savedBets = localStorage.getItem(storageKey);
    if (savedBets) {
      try {
        setBets(JSON.parse(savedBets));
      } catch (e) {
        console.error('Failed to parse prediction bets from localStorage', e);
      }
    } else {
      setBets([]);
    }
  }, [storageKey]);

  // Fetch from ESPN Scoreboard API with Firestore caching
  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = getTodayString();
      const datesRange = getDatesRangeString();
      let marketsList: Market[] = [];

      const allMarkets: Market[] = [];
      const leagues = [
        { sport: 'baseball', league: 'mlb', category: 'MLB', subCategory: 'Baseball' },
        { sport: 'basketball', league: 'nba', category: 'NBA', subCategory: 'Basketball' },
        { sport: 'football', league: 'nfl', category: 'NFL', subCategory: 'NFL' },
        { sport: 'soccer', league: 'eng.1', category: 'EPL', subCategory: 'Soccer' },
        { sport: 'soccer', league: 'esp.1', category: 'LALIGA', subCategory: 'Soccer' },
        { sport: 'soccer', league: 'fifa.world', category: 'FIFA', subCategory: 'FIFA' }
      ];

      await Promise.all(
        leagues.map(async ({ sport, league, category, subCategory }) => {
          try {
            const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${datesRange}`);
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data.events)) {
              data.events.forEach((event: any) => {
                const competition = event.competitions?.[0];
                const statusType = competition?.status?.type || event.status?.type;
                const isCompleted = statusType?.completed === true || statusType?.state === 'post';
                if (isCompleted) return;

                const competitors = competition?.competitors;
                if (Array.isArray(competitors) && competitors.length >= 2) {
                  const homeCompetitor = competitors.find((c: any) => c.homeAway === 'home');
                  const awayCompetitor = competitors.find((c: any) => c.homeAway === 'away');
                  if (homeCompetitor && awayCompetitor) {
                    const homeTeamName = homeCompetitor.team?.displayName || 'Home Team';
                    const awayTeamName = awayCompetitor.team?.displayName || 'Away Team';
                    const dateStr = event.date ? event.date.split('T')[0] : today;
                    const liveUrl = event.links?.find((link: any) => {
                      const rels = Array.isArray(link.rel) ? link.rel : [];
                      return rels.includes('summary') || rels.includes('gamecast');
                    })?.href || event.links?.[0]?.href || '';

                    let outcomePrices = [0.55, 0.45];
                    const oddsObj = competition?.odds?.[0];
                    if (oddsObj && oddsObj.moneyline) {
                      const homeOdds = oddsObj.moneyline.home?.close?.odds || oddsObj.moneyline.home?.open?.odds || oddsObj.moneyline.home?.odds;
                      const awayOdds = oddsObj.moneyline.away?.close?.odds || oddsObj.moneyline.away?.open?.odds || oddsObj.moneyline.away?.odds;
                      if (homeOdds && awayOdds) {
                        const pHome = parseAmericanOdds(homeOdds);
                        const pAway = parseAmericanOdds(awayOdds);
                        const sum = pHome + pAway;
                        if (sum > 0) {
                          const homeProb = parseFloat((pHome / sum).toFixed(2));
                          const awayProb = parseFloat((1 - homeProb).toFixed(2));
                          outcomePrices = [homeProb, awayProb];
                        }
                      }
                    }

                    allMarkets.push({
                      id: `espn_${sport}_${league}_${event.id}`,
                      question: `Will ${homeTeamName} win against ${awayTeamName}?`,
                      outcomes: ['Yes', 'No'],
                      outcomePrices: outcomePrices,
                      image: homeCompetitor.team?.logo || '',
                      liveUrl,
                      startDateTime: event.date || '',
                      category: category,
                      subCategory: subCategory,
                      volume: Math.floor(Math.random() * 30000) + 20000,
                      endDate: dateStr
                    });
                  }
                }
              });
            }
          } catch (sportErr) {
            console.warn(`Failed to fetch ESPN data for ${sport}/${league}:`, sportErr);
          }
        })
      );

      // Sort by end date ascending
      allMarkets.sort((a, b) => a.endDate.localeCompare(b.endDate));
      marketsList = allMarkets;

      setMarkets(marketsList);

      // Asynchronous translation logic
      if (language !== 'en' && language !== 'en-GB' && language !== 'gb' && marketsList.length > 0) {
        Promise.all(
          marketsList.map(async (m) => {
            try {
              const translatedQuestion = await translateText(m.question, language);
              const translatedCategory = await translateText(m.category || 'Other', language);
              return { 
                ...m, 
                question: translatedQuestion, 
                category: translatedCategory, 
                subCategory: m.subCategory 
              };
            } catch (err) {
              console.warn('Failed to translate question or category:', m.question, err);
              return m;
            }
          })
        ).then(translatedMarkets => {
          setMarkets(prev => {
            return prev.map(p => {
              const matched = translatedMarkets.find(t => t.id === p.id);
              return matched 
                ? { ...p, question: matched.question, category: matched.category } 
                : p;
            });
          });
        });
      }

    } catch (e) {
      console.warn('Failed to fetch from ESPN API.', e);
      setError('Failed to fetch real-time markets.');
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // Place a new bet
  const placeBet = useCallback((
    marketId: string,
    question: string,
    outcome: 'Yes' | 'No',
    amount: number,
    betPrice: number,
    isEventBet?: boolean
  ) => {
    const newBet: PredictionBet = {
      betId: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      marketId,
      question,
      outcome,
      amount,
      betPrice,
      status: 'pending',
      timestamp: Date.now(),
      isEventBet
    };

    setBets(prev => {
      const next = [newBet, ...prev];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });

    return newBet;
  }, [storageKey]);

  // Check real match results from Polymarket API
  const resolveBet = useCallback(async (betId: string, autoClaim = false): Promise<{ status: PredictionBet['status']; resolvedOutcome?: 'Yes' | 'No'; rewardAmount?: number; error?: string }> => {
    let resolvedStatus: PredictionBet['status'] = 'pending';
    let resolvedOutcome: 'Yes' | 'No' | undefined = undefined;
    let errorMessage: string | undefined = undefined;

    const savedBets = localStorage.getItem(storageKey);
    let currentBets: PredictionBet[] = [];
    if (savedBets) {
      try {
        currentBets = JSON.parse(savedBets);
      } catch (e) {
        console.error('Failed to parse bets for resolution', e);
      }
    }

    const targetBet = currentBets.find(b => b.betId === betId);
    if (!targetBet) {
      return { status: 'pending', error: 'Bet not found' };
    }

    if (targetBet.status !== 'pending') {
      return { status: targetBet.status, resolvedOutcome: targetBet.resolvedOutcome };
    }

    // Simulation for virtual markets
    if (targetBet.marketId.startsWith('virtual_')) {
      const yesProbability = targetBet.betPrice;
      const userChoseYes = targetBet.outcome === 'Yes';
      const roll = Math.random();
      const actualIsYes = roll < yesProbability;
      resolvedOutcome = actualIsYes ? 'Yes' : 'No';
      const isWin = (userChoseYes && actualIsYes) || (!userChoseYes && !actualIsYes);
      resolvedStatus = isWin ? 'win' : 'loss';
    } else if (targetBet.marketId.startsWith('espn_')) {
      try {
        const parts = targetBet.marketId.split('_');
        if (parts.length >= 4) {
          const sport = parts[1];
          const league = parts[2];
          const eventId = parts[3];

          // Try checking Firestore Cache first
          let firestoreResolved = false;
          try {
            const matchRef = doc(db, 'resolved_matches', eventId);
            const matchSnap = await getDoc(matchRef);
            if (matchSnap.exists()) {
              const matchData = matchSnap.data();
              if (matchData && matchData.resolvedOutcome) {
                resolvedOutcome = matchData.resolvedOutcome as 'Yes' | 'No';
                const userChoseYes = targetBet.outcome === 'Yes';
                const homeWon = resolvedOutcome === 'Yes';
                const isWin = (userChoseYes && homeWon) || (!userChoseYes && !homeWon);
                resolvedStatus = isWin ? 'win' : 'loss';
                firestoreResolved = true;
                if (DEBUG) console.log('[PredictionMarket] Settle bet using Firestore resolved_matches cache:', eventId);
              }
            }
          } catch (cacheErr) {
            console.warn('[PredictionMarket] Failed to check Firestore resolved_matches cache:', cacheErr);
          }

          if (!firestoreResolved) {
            const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eventId}`);
            if (!res.ok) {
              throw new Error('Failed to fetch ESPN game summary');
            }
            const data = await res.json();
            const competition = data.header?.competitions?.[0];
            const status = competition?.status;
            
            if (!competition) {
              errorMessage = 'Match competition not found in summary.';
            } else {
              const isCompleted = status?.type?.completed === true || status?.type?.state === 'post';
              if (isCompleted) {
                const competitors = competition.competitors;
                const homeCompetitor = competitors?.find((c: any) => c.homeAway === 'home');
                const awayCompetitor = competitors?.find((c: any) => c.homeAway === 'away');
                
                if (homeCompetitor && awayCompetitor) {
                  const homeScore = parseInt(homeCompetitor.score || '0', 10);
                  const awayScore = parseInt(awayCompetitor.score || '0', 10);
                  
                  let homeWon = false;
                  if (homeCompetitor.winner !== undefined) {
                    homeWon = homeCompetitor.winner === true;
                  } else {
                    homeWon = homeScore > awayScore;
                  }
                  
                  resolvedOutcome = homeWon ? 'Yes' : 'No';
                  
                  const userChoseYes = targetBet.outcome === 'Yes';
                  const isWin = (userChoseYes && homeWon) || (!userChoseYes && !homeWon);
                  resolvedStatus = isWin ? 'win' : 'loss';

                  // Write to Firestore cache
                  try {
                    const matchRef = doc(db, 'resolved_matches', eventId);
                    await setDoc(matchRef, {
                      gameId: eventId,
                      resolvedOutcome,
                      homeTeam: homeCompetitor.team?.displayName || 'Home Team',
                      awayTeam: awayCompetitor.team?.displayName || 'Away Team',
                      homeScore,
                      awayScore,
                      updatedAt: Date.now()
                    });
                    if (DEBUG) console.log('[PredictionMarket] Cached resolved match in Firestore:', eventId);
                  } catch (cacheWriteErr) {
                    console.warn('[PredictionMarket] Failed to write resolved match cache in Firestore:', cacheWriteErr);
                  }
                } else {
                  errorMessage = 'Scores or competitor info are not available yet.';
                }
              } else {
                errorMessage = 'Match is still live or scheduled. Please wait until it completes.';
              }
            }
          }
        } else {
          errorMessage = 'Invalid ESPN market ID format.';
        }
      } catch (err: any) {
        console.error('Error checking ESPN match resolution:', err);
        errorMessage = `Failed to fetch match result: ${err.message || 'Unknown error'}`;
      }
    } else if (targetBet.marketId.startsWith('oddsapi_')) {
      // Real The Odds API Oracle Settlement check
      try {
        const parts = targetBet.marketId.split('_');
        if (parts.length >= 3) {
          const gameId = parts[1];
          const sportKey = parts.slice(2).join('_');

          // Try checking Firestore Cache first
          let firestoreResolved = false;
          try {
            const matchRef = doc(db, 'resolved_matches', gameId);
            const matchSnap = await getDoc(matchRef);
            if (matchSnap.exists()) {
              const matchData = matchSnap.data();
              if (matchData && matchData.resolvedOutcome) {
                resolvedOutcome = matchData.resolvedOutcome as 'Yes' | 'No';
                const userChoseYes = targetBet.outcome === 'Yes';
                const homeWon = resolvedOutcome === 'Yes';
                const isWin = (userChoseYes && homeWon) || (!userChoseYes && !homeWon);
                resolvedStatus = isWin ? 'win' : 'loss';
                firestoreResolved = true;
                if (DEBUG) console.log('[PredictionMarket] Settle bet using Firestore resolved_matches cache:', gameId);
              }
            }
          } catch (cacheErr) {
            console.warn('[PredictionMarket] Failed to check Firestore resolved_matches cache:', cacheErr);
          }

          if (!firestoreResolved) {
            const res = await fetch(`https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=56071cacc236a0d513e40440282f5552&daysFrom=3`);
            if (!res.ok) {
              throw new Error('Failed to fetch Odds API scores');
            }
            const data = await res.json();
            const event = data.find((e: any) => String(e.id) === gameId);

            if (!event) {
              errorMessage = 'Match not found in the scores list.';
            } else {
              if (event.completed === true) {
                const homeScoreObj = event.scores?.find((s: any) => s.name === event.home_team);
                const awayScoreObj = event.scores?.find((s: any) => s.name === event.away_team);
                
                if (homeScoreObj && awayScoreObj) {
                  const homeScore = parseInt(homeScoreObj.score, 10);
                  const awayScore = parseInt(awayScoreObj.score, 10);
                  const homeWon = homeScore > awayScore;
                  
                  resolvedOutcome = homeWon ? 'Yes' : 'No';
                  
                  const userChoseYes = targetBet.outcome === 'Yes';
                  const isWin = (userChoseYes && homeWon) || (!userChoseYes && !homeWon);
                  resolvedStatus = isWin ? 'win' : 'loss';

                  // Write to Firestore cache so future checks for this match are 100% free
                  try {
                    const matchRef = doc(db, 'resolved_matches', gameId);
                    await setDoc(matchRef, {
                      gameId,
                      resolvedOutcome,
                      homeTeam: event.home_team,
                      awayTeam: event.away_team,
                      homeScore,
                      awayScore,
                      updatedAt: Date.now()
                    });
                    if (DEBUG) console.log('[PredictionMarket] Cached resolved match in Firestore:', gameId);
                  } catch (cacheWriteErr) {
                    console.warn('[PredictionMarket] Failed to write resolved match cache in Firestore:', cacheWriteErr);
                  }
                } else {
                  errorMessage = 'Scores are not available for this event yet.';
                }
              } else {
                errorMessage = 'Match is still live or scheduled. Please wait until it completes.';
              }
            }
          }
        } else {
          errorMessage = 'Invalid Odds API market ID format.';
        }
      } catch (err) {
        console.error('Error checking Odds API match resolution:', err);
        errorMessage = 'Failed to fetch match result from Odds API. Please try again later.';
      }
    } else {
      // Real Polymarket Oracle Settlement check
      try {
        const res = await fetch(`https://gamma-api.polymarket.com/markets/${targetBet.marketId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch market details');
        }
        const marketData = await res.json();
        
        if (!marketData.closed) {
          errorMessage = 'Market is still open. Please wait until the match ends and resolves.';
        } else {
          let outcomePrices: number[] = [];
          if (marketData.outcomePrices) {
            const rawPrices = parseArray(marketData.outcomePrices);
            outcomePrices = rawPrices.map((p: string) => parseFloat(p) || 0);
          }

          if (outcomePrices.length >= 2) {
            const yesPrice = outcomePrices[0];
            const noPrice = outcomePrices[1];

            if (yesPrice >= 0.9) {
              resolvedOutcome = 'Yes';
            } else if (noPrice >= 0.9) {
              resolvedOutcome = 'No';
            } else {
              errorMessage = 'Market is closed, but final consensus/resolution is still pending on Polymarket.';
            }

            if (resolvedOutcome) {
              const userChoseYes = targetBet.outcome === 'Yes';
              const isWin = (userChoseYes && resolvedOutcome === 'Yes') || (!userChoseYes && resolvedOutcome === 'No');
              resolvedStatus = isWin ? 'win' : 'loss';
            }
          } else {
            errorMessage = 'Invalid outcome details from oracle.';
          }
        }
      } catch (err) {
        console.error('Error checking match resolution:', err);
        errorMessage = 'Failed to fetch match result from Polymarket. Please try again later.';
      }
    }

    let rewardAmount = 0;
    if (autoClaim && resolvedStatus === 'win') {
      const price = targetBet.betPrice > 0 ? targetBet.betPrice : 0.5;
      rewardAmount = Math.round(targetBet.amount / price);
    }

    if (resolvedStatus !== 'pending' && resolvedOutcome) {
      setBets(prev => {
        const next = prev.map(bet => {
          if (bet.betId === betId) {
            return {
              ...bet,
              status: autoClaim && resolvedStatus === 'win' ? 'claimed' as const : resolvedStatus,
              resolvedOutcome
            };
          }
          return bet;
        });
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    }

    return { status: resolvedStatus, resolvedOutcome, rewardAmount, error: errorMessage };
  }, [storageKey]);

  // Claim reward
  const claimReward = useCallback((betId: string) => {
    let rewardAmount = 0;
    const bet = bets.find(b => b.betId === betId);
    if (bet && bet.status === 'win') {
      const price = bet.betPrice > 0 ? bet.betPrice : 0.5;
      rewardAmount = Math.round(bet.amount / price);
    }

    if (rewardAmount > 0) {
      setBets(prev => {
        const next = prev.map(b => {
          if (b.betId === betId && b.status === 'win') {
            return {
              ...b,
              status: 'claimed' as const
            };
          }
          return b;
        });
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    }
    return rewardAmount;
  }, [bets, storageKey]);

  return {
    markets,
    bets,
    loading,
    error,
    fetchMarkets,
    placeBet,
    resolveBet,
    claimReward
  };
};
