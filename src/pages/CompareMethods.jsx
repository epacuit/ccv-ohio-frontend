// Hidden page comparing RCV (Instant Runoff) vs Consensus Choice (Head-to-Head)
// on a ranked-choice dataset. Default dataset is Alaska 2022; users can upload
// their own ranked CSV.
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  UploadFile as UploadIcon,
  Restore as RestoreIcon,
  HelpOutline as HelpIcon,
  School as SchoolIcon,
} from '@mui/icons-material';

import { OHIO_COUNTIES, OHIO_SVG_WIDTH, OHIO_SVG_HEIGHT } from '../assets/ohioCounties';
import alaskaCsvRaw from '../data/alaska2022.csv?raw';
import pluralityVsIrvCsvRaw from '../data/plurality-vs-irv.csv?raw';
import threeWinnersCsvRaw from '../data/three-winners.csv?raw';
import { parseRankingsCsv, computeComparisonData } from '../utils/electionCompute';
import ResultsDisplay from '../components/ResultsDisplay';
import RCVRoundsDisplay, { Sankey, computePlacement, buildColorFn } from '../components/compare/RCVRoundsDisplay';
import PluralityDisplay from '../components/compare/PluralityDisplay';
import RankingBallotDisplay from '../components/compare/RankingBallotDisplay';

// Registry of bundled example datasets. Add more by importing a CSV with ?raw
// and appending a { key, name, csv } entry below.
const PRESETS = [
  {
    key: 'alaska2022',
    name: 'Alaska 2022 U.S. House Special Election',
    csv: alaskaCsvRaw,
  },
  {
    key: 'plurality-vs-irv',
    name: 'Sample Election 1',
    csv: pluralityVsIrvCsvRaw,
  },
  {
    key: 'three-winners',
    name: 'Sample Election 2',
    csv: threeWinnersCsvRaw,
  },
];
const DEFAULT_PRESET_KEY = 'alaska2022';

// ----------------------------------------------------------------
// Shared candidate palette (falls back by index for unknown names)
// ----------------------------------------------------------------
const FALLBACK_PALETTE = ['#1565C0', '#C62828', '#E65100', '#2E7D32', '#6A1B9A', '#00838F', '#558B2F'];
const NAMED_COLORS = {
  Begich: '#E65100',
  Palin: '#C62828',
  Peltola: '#1565C0',
};
export const makeColorFn = (candidates) => (name) => {
  if (NAMED_COLORS[name]) return NAMED_COLORS[name];
  const idx = candidates.indexOf(name);
  return idx >= 0 ? FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length] : '#607D8B';
};

// ----------------------------------------------------------------
// Build ResultsDisplay-compatible `results` from computed data
// ----------------------------------------------------------------
const buildConsensusResults = (data) => {
  const pairwise_matrix = {};
  // HeadToHeadTable reads actual vote counts from this keyed object (not from
  // the margin matrix). Key format: `${A}_vs_${B}` with A alphabetically first.
  const detailed_pairwise_results = {};
  data.candidates.forEach((a) => {
    pairwise_matrix[a] = {};
    data.candidates.forEach((b) => {
      if (a === b) return;
      pairwise_matrix[a][b] = data.h2h[a][b].margin;
    });
  });
  for (let i = 0; i < data.candidates.length; i++) {
    for (let j = i + 1; j < data.candidates.length; j++) {
      const a = data.candidates[i];
      const b = data.candidates[j];
      const key = `${a}_vs_${b}`;
      detailed_pairwise_results[key] = {
        [a]: data.h2h[a][b].prefers,
        [b]: data.h2h[b][a].prefers,
      };
    }
  }

  // Determine winner_type
  let winner_type = 'smallest_loss';
  let winner = null;
  if (data.condorcet_winner) {
    winner_type = 'condorcet';
    winner = data.condorcet_winner;
  } else {
    // Fallback: smallest loss
    let best = null;
    let bestLoss = -Infinity;
    data.candidates.forEach((c) => {
      const losses = Object.entries(pairwise_matrix[c]).filter(([, m]) => m < 0);
      if (losses.length === 0) {
        winner_type = 'most_wins';
        winner = c;
        return;
      }
      const worstLoss = Math.min(...losses.map(([, m]) => m));
      if (worstLoss > bestLoss) {
        bestLoss = worstLoss;
        best = c;
      }
    });
    if (!winner) winner = best;
  }

  return {
    winner_type,
    winner,
    pairwise_matrix,
    detailed_pairwise_results,
    statistics: { total_votes: data.total_ballots },
  };
};

// ----------------------------------------------------------------
// Walkthrough steps
// ----------------------------------------------------------------
const STEP_LABELS = ['Primary', 'Ballots', 'Election Night', 'Ballot Processing', 'Winner', 'Reporting'];

const SIDE_WIDTH = { xs: '100%', md: '50%' };

// Unified label color for the walkthrough's RCV and H2H columns.
const SIDE_HEADER_COLOR = 'text.primary';

const SideHeader = ({ title, subtitle }) => (
  <Box sx={{ mb: 2, pb: 1.5, borderBottom: '2px solid', borderColor: SIDE_HEADER_COLOR }}>
    <Typography
      variant="overline"
      sx={{ fontWeight: 700, color: SIDE_HEADER_COLOR, letterSpacing: 1.2 }}
    >
      {title}
    </Typography>
    <Typography variant="caption" color="text.secondary" component="div">
      {subtitle}
    </Typography>
  </Box>
);

// ----------------------------------------------------------------
// Walkthrough uses its own synthetic primary field (independent of Tabs 1 & 2)
// ----------------------------------------------------------------
const DEMO_CANDIDATES = [
  { name: 'Ana',    pct: 24, color: '#7B1FA2' },
  { name: 'Bob',    pct: 20, color: '#00695C' },
  { name: 'Carla',  pct: 17, color: '#E65100' },
  { name: 'David',  pct: 13, color: '#43A047' },
  { name: 'Esther', pct: 10, color: '#1565C0' },
  { name: 'Frank',  pct: 7,  color: '#5D4037' },
  { name: 'Grace',  pct: 5,  color: '#8E6B8D' },
  { name: 'Hank',   pct: 4,  color: '#827717' },
];

const demoColorFor = (name) => {
  const c = DEMO_CANDIDATES.find((x) => x.name === name);
  return c ? c.color : '#607D8B';
};

const topKAdvancing = (k) => DEMO_CANDIDATES.slice(0, k).map((c) => c.name);

// Synthetic ballots used for Election Night / Winner / Reporting steps.
// Verified: IRV winner = Bob, Condorcet winner = Carla for k ∈ {3,4,5}.
// Each set now includes some truncated/partial ballots so the Sankey always
// shows exhausted votes when an elimination happens.
const WALKTHROUGH_BALLOTS = {
  2: [
    { count: 6000, ranking: { Ana: 1, Bob: 2 } },
    { count: 4000, ranking: { Bob: 1, Ana: 2 } },
  ],
  3: [
    { count: 4000, ranking: { Ana: 1, Carla: 2, Bob: 3 } },
    { count: 3500, ranking: { Bob: 1, Carla: 2, Ana: 3 } },
    { count: 1500, ranking: { Carla: 1, Bob: 2, Ana: 3 } },
    { count:  500, ranking: { Carla: 1, Ana: 2, Bob: 3 } },
    { count:  500, ranking: { Carla: 1 } }, // bullet vote → exhausts when Carla is eliminated
  ],
  4: [
    { count: 3500, ranking: { Ana: 1, Carla: 2, Bob: 3, David: 4 } },
    { count: 2700, ranking: { Bob: 1, Carla: 2, Ana: 3, David: 4 } },
    { count: 2000, ranking: { Carla: 1, Bob: 2, Ana: 3, David: 4 } },
    { count:  900, ranking: { David: 1, Bob: 2, Ana: 3, Carla: 4 } },
    { count:  500, ranking: { David: 1, Carla: 2, Ana: 3, Bob: 4 } },
    { count:  400, ranking: { David: 1 } }, // bullet vote → exhausts when David is eliminated
  ],
  5: [
    { count: 3200, ranking: { Ana: 1, Carla: 2, Bob: 3, David: 4, Esther: 5 } },
    { count: 2500, ranking: { Bob: 1, Carla: 2, Ana: 3, Esther: 4, David: 5 } },
    { count: 1500, ranking: { Carla: 1, Bob: 2, Ana: 3, Esther: 4, David: 5 } },
    { count:  300, ranking: { Carla: 1, Bob: 2 } }, // partial
    { count: 1200, ranking: { David: 1, Bob: 2, Carla: 3, Ana: 4, Esther: 5 } },
    { count:  300, ranking: { David: 1 } }, // bullet vote
    { count:  600, ranking: { Esther: 1, Carla: 2, Bob: 3, Ana: 4, David: 5 } },
    { count:  400, ranking: { Esther: 1, Carla: 2 } }, // partial → exhausts when both E and C are out
  ],
};

// Illustrative "ballot overview" stats for the IRV report. These represent
// ballots that would be set aside BEFORE Round 1 — overvotes (two candidates
// at the same rank) and undervotes (blank first choice).
const WALKTHROUGH_BALLOT_META = {
  2: { overvotes: 0,   undervotes: 0  },
  3: { overvotes: 45,  undervotes: 30 },
  4: { overvotes: 65,  undervotes: 40 },
  5: { overvotes: 95,  undervotes: 60 },
};

// Compute walkthrough data (rounds, transfers, H2H) from the current top-k.
const buildWalkthroughData = (topK) => {
  const candidates = topKAdvancing(topK);
  const ballots = WALKTHROUGH_BALLOTS[topK] || WALKTHROUGH_BALLOTS[3];
  const rankings = ballots.map((b) => b.ranking);
  const rcounts = ballots.map((b) => b.count);
  const computed = computeComparisonData(
    { candidates, rankings, rcounts },
    `Synthetic ${topK}-candidate election`
  );
  const meta = WALKTHROUGH_BALLOT_META[topK] || { overvotes: 0, undervotes: 0 };
  return { ...computed, ...meta };
};

// Remount-driven animated bar chart. Using key={topK} on the wrapper ensures
// React fully resets the component (width goes 0 → target) on every selection.
const AnimatedPrimaryBars = ({ advancing }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Two rAFs guarantee the 0%-width frame paints before transitioning to target.
    let id1;
    let id2;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setAnimated(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, []);

  const maxPct = Math.max(...DEMO_CANDIDATES.map((c) => c.pct));

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      {DEMO_CANDIDATES.map((c) => {
        const isAdvancing = advancing.includes(c.name);
        const targetWidth = (c.pct / maxPct) * 100;
        return (
          <Box key={c.name} sx={{ mb: 1.5, opacity: isAdvancing ? 1 : 0.35, transition: 'opacity 0.4s' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: c.color, fontSize: '1rem' }}>
                {c.name}
                {isAdvancing && (
                  <Typography component="span" variant="body1" sx={{ ml: 1, color: 'success.main', fontWeight: 500, fontSize: '1rem' }}>
                    advancing
                  </Typography>
                )}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                {c.pct}%
              </Typography>
            </Box>
            <Box sx={{ height: 18, bgcolor: 'grey.100', borderRadius: 0.5, overflow: 'hidden' }}>
              <Box sx={{
                width: animated ? `${targetWidth}%` : '0%',
                height: '100%',
                bgcolor: c.color,
                transition: 'width 1.0s cubic-bezier(0.25, 0.8, 0.3, 1)',
              }} />
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
};

// ---- Step 1: Top-k selector first, then animated primary bars ---- //
const Step1Primary = ({ topK, onTopKChange }) => {
  const advancing = topKAdvancing(topK);

  return (
    <Box sx={{ maxWidth: 620, mx: 'auto' }}>
      {/* Top-k selector first */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ToggleButtonGroup
          value={topK}
          exclusive
          size="small"
          onChange={(_, v) => { if (v !== null) onTopKChange(v); }}
          sx={{ bgcolor: 'background.paper' }}
        >
          {[2, 3, 4, 5].map((k) => (
            <ToggleButton key={k} value={k} sx={{ px: 2.5, textTransform: 'none', fontWeight: 600 }}>
              Top {k}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.35rem' } }}>
          Primary Election
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
          {DEMO_CANDIDATES.length} candidates compete in the primary. The top {topK} advance to the general election.
        </Typography>
      </Box>

      {/* key={topK} forces a full remount so bars restart from 0 on every change */}
      <AnimatedPrimaryBars key={topK} advancing={advancing} />

      <Typography variant="body1" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center', fontSize: '1rem' }}>
        {advancing.join(', ')} advance to the general election.
      </Typography>
    </Box>
  );
};

// ----------------------------------------------------------------
// Step 2 helpers: bidirectional ranking ↔ head-to-head inference
// ----------------------------------------------------------------
const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const allPairs = (cands) => {
  const result = [];
  for (let i = 0; i < cands.length; i++) {
    for (let j = i + 1; j < cands.length; j++) {
      result.push([cands[i], cands[j]]);
    }
  }
  return result;
};

// Does candidate `cand` have "no skip above"? i.e. every rank 1..rank(cand)-1
// is occupied by some candidate. Only then does ranked > unranked follow.
const noSkipAbove = (cand, ranking) => {
  const k = ranking[cand];
  if (k === undefined) return false;
  const occupied = new Set(Object.values(ranking));
  for (let i = 1; i < k; i++) {
    if (!occupied.has(i)) return false;
  }
  return true;
};

// Ranking → H2H. Each pair value is an array:
//   [a]     → A strictly preferred
//   [b]     → B strictly preferred
//   [a, b]  → tie (voter picked both)
//   null    → unknown
// Inference from partial ranking: if A is ranked AND has no skip above, and B
// is unranked, then A > B. If there IS a skip above A, we can't assume.
const rankingToH2H = (ranking, cands) => {
  const out = {};
  for (const [a, b] of allPairs(cands)) {
    const key = pairKey(a, b);
    const ra = ranking[a];
    const rb = ranking[b];
    const aRanked = ra !== undefined;
    const bRanked = rb !== undefined;
    if (aRanked && bRanked) {
      if (ra < rb) out[key] = [a];
      else if (rb < ra) out[key] = [b];
      else out[key] = [a, b]; // tie
    } else if (aRanked && !bRanked && noSkipAbove(a, ranking)) {
      out[key] = [a];
    } else if (bRanked && !aRanked && noSkipAbove(b, ranking)) {
      out[key] = [b];
    } else {
      out[key] = null;
    }
  }
  return out;
};

// H2H → ranking. Iterative topological placement:
//   Rank 1 gets candidates that nobody strictly beats.
//   Each subsequent rank gets candidates whose strict beaters are all already
//   placed. A candidate is only placeable if (a) all of its own pairs are
//   answered, AND (b) every candidate that strictly beats it is also placed.
//   This avoids the bug where Bob appears at rank 2 when David > Bob but
//   David's position is still undetermined.
const h2hToRanking = (h2h, cands) => {
  // Fully-answered = every pair involving this candidate is filled.
  const fullyAnswered = new Set();
  for (const c of cands) {
    const allDone = cands.every((other) => {
      if (other === c) return true;
      const p = h2h[pairKey(c, other)];
      return p && p.length > 0;
    });
    if (allDone) fullyAnswered.add(c);
  }

  let anyFilled = false;
  let anyMissing = false;
  for (const [a, b] of allPairs(cands)) {
    const p = h2h[pairKey(a, b)];
    if (!p || p.length === 0) { anyMissing = true; continue; }
    anyFilled = true;
  }
  if (!anyFilled || fullyAnswered.size === 0) {
    return { ranking: {}, incomplete: anyMissing, error: false };
  }

  const strictlyBeats = (x, c) => {
    const p = h2h[pairKey(x, c)];
    return p && p.length === 1 && p[0] === x;
  };

  const placed = {};
  const remaining = new Set(fullyAnswered);
  let currentRank = 1;

  while (remaining.size > 0) {
    const readyNow = [];
    for (const c of remaining) {
      let ready = true;
      for (const other of cands) {
        if (other === c) continue;
        // Must also check non-fully-answered beaters — if they exist, C can't
        // be placed because their rank is unknown.
        if (strictlyBeats(other, c) && placed[other] === undefined) {
          ready = false;
          break;
        }
      }
      if (ready) readyNow.push(c);
    }
    if (readyNow.length === 0) break;
    for (const c of readyNow) {
      placed[c] = currentRank;
      remaining.delete(c);
    }
    currentRank += 1;
  }

  // Consistency: every answered pair with both candidates placed must agree.
  for (const [a, b] of allPairs(cands)) {
    const pick = h2h[pairKey(a, b)];
    if (!pick || pick.length === 0) continue;
    const ra = placed[a];
    const rb = placed[b];
    if (ra === undefined || rb === undefined) continue;
    if (pick.length === 2 && ra !== rb) return { ranking: null, incomplete: false, error: true };
    if (pick.length === 1 && pick[0] === a && !(ra < rb)) return { ranking: null, incomplete: false, error: true };
    if (pick.length === 1 && pick[0] === b && !(rb < ra)) return { ranking: null, incomplete: false, error: true };
  }

  // Stuck with answers fully filled but candidates unplaced → cycle.
  if (remaining.size > 0 && !anyMissing) {
    return { ranking: null, incomplete: false, error: true };
  }

  return {
    ranking: placed,
    incomplete: anyMissing || remaining.size > 0,
    error: false,
  };
};

// ----------------------------------------------------------------
// Interactive H2H ballot — two candidate rows. Selecting both = tie.
// When `readOnly` is true, clicks are ignored (inference-only view).
// ----------------------------------------------------------------
const H2HBallotInteractive = ({ matchups, choices, onChange, colorFor, readOnly = false }) => {
  const toggleCandidate = (a, b, name) => {
    if (readOnly) return;
    const key = pairKey(a, b);
    const current = choices[key] || [];
    const next = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    onChange({ ...choices, [key]: next.length > 0 ? next : null });
  };

  const renderRow = (a, b, selectedArr, name, labelColor) => {
    const selected = selectedArr.includes(name);
    return (
      <Box
        key={name}
        onClick={() => toggleCandidate(a, b, name)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 0.5,
          cursor: readOnly ? 'default' : 'pointer',
          borderRadius: 0.5,
          px: 0.5,
          '&:hover': readOnly ? {} : { bgcolor: 'action.hover' },
        }}
      >
        <Box sx={{
          width: 20, height: 20, borderRadius: '50%',
          border: '2px solid',
          borderColor: selected ? 'text.primary' : 'text.secondary',
          backgroundColor: selected ? '#1a1a1a' : 'transparent',
          mr: 1,
          position: 'relative',
          flexShrink: 0,
          '&::after': selected ? {
            content: '""',
            position: 'absolute',
            top: '2px', left: '2px', right: '2px', bottom: '2px',
            borderRadius: '50%',
            backgroundColor: '#1a1a1a',
          } : {},
        }} />
        <Typography variant="body1" sx={{
          fontWeight: selected ? 700 : 500,
          color: selected ? labelColor : 'text.primary',
        }}>
          {name}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, position: 'relative' }}>
      {readOnly && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: alpha('#ffffff', 0.02),
          pointerEvents: 'auto',
          zIndex: 1,
        }} />
      )}
      {matchups.map(([a, b], i) => {
        const key = pairKey(a, b);
        const selectedArr = choices[key] || [];
        const isTie = selectedArr.length === 2;
        return (
          <Box key={i}>
            {i > 0 && <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', my: 1.25 }} />}
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Matchup {i + 1}
              {isTie && (
                <Typography component="span" variant="body1" sx={{ ml: 1, fontStyle: 'italic', fontSize: '1rem' }}>
                  — tie
                </Typography>
              )}
            </Typography>
            {renderRow(a, b, selectedArr, a, colorFor(a))}
            {renderRow(a, b, selectedArr, b, colorFor(b))}
          </Box>
        );
      })}
    </Paper>
  );
};

// ---- Step 2: Bidirectional ballots ---- //
const Step2Ballots = ({ topK }) => {
  const advancing = useMemo(() => topKAdvancing(topK), [topK]);
  const matchups = useMemo(() => allPairs(advancing), [advancing]);

  // Source-of-truth state: both ranking and h2h are maintained.
  // When user edits one, the other is recomputed from it.
  const [ranking, setRanking] = useState({});
  const [h2h, setH2H] = useState({});
  const [lastEdited, setLastEdited] = useState(null);

  // Reset when topK changes (candidates change)
  useEffect(() => {
    setRanking({});
    setH2H({});
    setLastEdited(null);
  }, [topK]);

  const handleRankingChange = (next) => {
    setRanking(next);
    setH2H(rankingToH2H(next, advancing));
    setLastEdited('ranking');
  };

  const handleH2HChange = (next) => {
    setH2H(next);
    const derived = h2hToRanking(next, advancing);
    if (derived.ranking) {
      setRanking(derived.ranking);
    } else {
      setRanking({}); // error: no consistent ranking
    }
    setLastEdited('h2h');
  };

  // Both ballots shown for any top-k
  let rankingNote = null;
  if (lastEdited === 'h2h') {
    const derived = h2hToRanking(h2h, advancing);
    if (derived.error) {
      rankingNote = {
        severity: 'warning',
        text: 'Cannot infer a ranking from these head-to-head preferences.',
      };
    } else if (derived.incomplete && Object.keys(derived.ranking || {}).length > 0) {
      rankingNote = {
        severity: 'info',
        text: 'A candidate is added to the ranking once all of their head-to-head matchups are answered.',
      };
    }
  }

  return (
    <Box>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
      }}>
        <Box sx={{ width: SIDE_WIDTH }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
          >
            Instant Runoff
          </Typography>
          <RankingBallotDisplay
            candidates={advancing}
            ranking={ranking}
            onChange={handleRankingChange}
            numRanks={topK}
            allowTies
          />
          {rankingNote && (
            <Alert severity={rankingNote.severity} sx={{ mt: 1.5 }}>
              {rankingNote.text}
            </Alert>
          )}
        </Box>

        <Box sx={{ width: SIDE_WIDTH }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
          >
            Head-to-Head
          </Typography>
          {topK >= 5 && (
            <Alert severity="info" icon={false} sx={{ mb: 1.5, py: 0.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Read-only
              </Typography>
              <Typography variant="body1" component="div" sx={{ fontSize: '1rem' }}>
                Too many matchups to answer directly. Edit the ranking on the left — these update automatically.
              </Typography>
            </Alert>
          )}
          <Box sx={{ opacity: topK >= 5 ? 0.85 : 1 }}>
            <H2HBallotInteractive
              matchups={matchups}
              choices={h2h}
              onChange={handleH2HChange}
              colorFor={demoColorFor}
              readOnly={topK >= 5}
            />
          </Box>
        </Box>
      </Box>

      {topK === 2 && (
        <Typography variant="body1" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center', maxWidth: 560, mx: 'auto', fontSize: '1rem' }}>
          With only 2 candidates, the two ballot styles carry identical information — one pick, one rank.
        </Typography>
      )}
    </Box>
  );
};

// Deterministic per-county activation threshold in [0, 1].
// A county "reports" when progress >= threshold. We keep a small band around
// the threshold as "partial" so some counties look mid-count at any time.
const COUNTY_ACTIVATION = (() => {
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  return OHIO_COUNTIES.map(() => rand());
})();

// ---- Step 3: Election Night ---- //
const Step3ElectionNight = ({ data, colorFor }) => {
  const theme = useTheme();
  const [progress, setProgress] = useState(0.55);
  const h2h = data.h2h;

  // Build list of pairwise matchups in alphabetical order
  const pairs = [];
  for (let i = 0; i < data.candidates.length; i++) {
    for (let j = i + 1; j < data.candidates.length; j++) {
      const a = data.candidates[i];
      const b = data.candidates[j];
      const aWins = h2h[a][b].margin > 0;
      pairs.push({
        winner: aWins ? a : b,
        loser: aWins ? b : a,
      });
    }
  }

  return (
    <Box>
      {(() => {
        // Partial-reporting band: counties inside the band are "partly in"
        const PARTIAL_BAND = 0.06;
        const total = OHIO_COUNTIES.length;
        let reported = 0;
        let partial = 0;
        COUNTY_ACTIVATION.forEach((t) => {
          if (progress >= t + PARTIAL_BAND) reported += 1;
          else if (progress >= t - PARTIAL_BAND) partial += 1;
        });
        const pending = total - reported - partial;

        return (
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            {/* Anonymized district map (cropped fragment of the county shapes) */}
            <Box sx={{ flexShrink: 0 }}>
              <svg
                viewBox="80 140 180 150"
                width="220"
                height="180"
                style={{ display: 'block' }}
              >
                {OHIO_COUNTIES.map((county, idx) => {
                  const t = COUNTY_ACTIVATION[idx];
                  let fill, opacity;
                  if (progress >= t + PARTIAL_BAND) {
                    fill = theme.palette.primary.main;
                    opacity = 0.85;
                  } else if (progress >= t - PARTIAL_BAND) {
                    fill = theme.palette.primary.main;
                    opacity = 0.3;
                  } else {
                    fill = theme.palette.grey[200];
                    opacity = 1;
                  }
                  return (
                    <path
                      key={county.id}
                      d={county.path}
                      fill={fill}
                      fillOpacity={opacity}
                      stroke={theme.palette.divider}
                      strokeWidth="0.6"
                      style={{ transition: 'fill 0.4s ease, fill-opacity 0.4s ease' }}
                    />
                  );
                })}
              </svg>
            </Box>

            {/* Reporting info on the right */}
            <Box>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
                {reported} of {total} districts reporting
              </Typography>
              {partial > 0 && (
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem', mb: 0.5 }}>
                  {partial} partial · {pending} pending
                </Typography>
              )}
              {pending === 0 && partial === 0 && (
                <Typography variant="body1" color="success.main" sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>
                  All districts in
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: 'primary.main', opacity: 0.85, borderRadius: 0.3 }} />
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>Reported</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: 'primary.main', opacity: 0.3, borderRadius: 0.3 }} />
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>Partial</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: 'grey.200', borderRadius: 0.3, border: '1px solid', borderColor: 'grey.300' }} />
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>Pending</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button size="small" onClick={() => setProgress(Math.max(0, progress - 0.15))}>−</Button>
                <Button size="small" onClick={() => setProgress(Math.min(1, progress + 0.15))}>+</Button>
              </Box>
            </Box>
          </Box>
        );
      })()}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* RCV side */}
        <Box sx={{ width: SIDE_WIDTH }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
          >
            Instant Runoff
          </Typography>
          {data.candidates.length === 2 ? (
            /* 2-candidate case: IRV collapses to plurality, no waiting needed */
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5, fontSize: '1rem' }}>
                Current first-choice totals
              </Typography>
              {(() => {
                const tallies = data.rounds[0].tallies;
                const finalTotal = Object.values(tallies).reduce((s, x) => s + x, 0);
                return Object.entries(tallies)
                  .sort((a, b) => b[1] - a[1])
                  .map(([c, v]) => {
                    const currentVotes = v * progress;
                    const barWidth = finalTotal > 0 ? (currentVotes / finalTotal) * 100 : 0;
                    const sharePct = finalTotal > 0 ? (v / finalTotal) * 100 : 0;
                    return (
                      <Box key={c} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: colorFor(c), fontSize: '1rem' }}>
                            {c}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                            {Math.round(currentVotes).toLocaleString()} ({sharePct.toFixed(1)}%)
                          </Typography>
                        </Box>
                        <Box sx={{ height: 12, bgcolor: 'grey.100', borderRadius: 0.5, overflow: 'hidden' }}>
                          <Box sx={{
                            width: `${barWidth}%`,
                            height: '100%',
                            bgcolor: colorFor(c),
                            transition: 'width 0.4s',
                          }} />
                        </Box>
                      </Box>
                    );
                  });
              })()}
              <Typography variant="body1" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '1rem' }}>
                With only 2 candidates, no elimination is needed — the leader has a majority.
              </Typography>
            </Paper>
          ) : progress < 1 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: alpha('#C62828', 0.03) }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1, fontSize: '1rem' }}>
                Waiting for ballots...
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div" sx={{ fontSize: '1rem' }}>
                Cannot tabulate results until all ballots received since the
                elimination order depends on the first-place totals and ballots
                are needed to redistribute the results.
              </Typography>
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                Running rounds…
              </Typography>
              {data.rounds.map((r) => {
                const tot = Object.values(r.tallies).reduce((s, v) => s + v, 0);
                return (
                  <Box key={r.round} sx={{ mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1rem' }}>Round {r.round}</Typography>
                    {Object.entries(r.tallies).sort((a, b) => b[1] - a[1]).map(([c, v]) => {
                      const pct = (v / tot) * 100;
                      return (
                        <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.4 }}>
                          <Typography variant="body1" sx={{ width: 70, color: colorFor(c), fontWeight: 600, fontSize: '1rem' }}>
                            {c}
                          </Typography>
                          <Box sx={{ flex: 1, height: 10, bgcolor: 'grey.100', borderRadius: 0.5, overflow: 'hidden' }}>
                            <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: colorFor(c) }} />
                          </Box>
                          <Typography variant="body1" sx={{ width: 55, textAlign: 'right', fontSize: '1rem' }}>
                            {pct.toFixed(0)}%
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
            </Paper>
          )}
        </Box>

        {/* Consensus side — bars grow live */}
        <Box sx={{ width: SIDE_WIDTH }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
          >
            Head-to-Head
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {pairs.map(({ winner, loser }, i) => {
              const wPref = h2h[winner][loser].prefers * progress;
              const lPref = h2h[winner][loser].opponent_prefers * progress;
              const total = wPref + lPref;
              const wWidth = total > 0 ? (wPref / (wPref + lPref)) * 100 : 0;
              const lWidth = total > 0 ? (lPref / (wPref + lPref)) * 100 : 0;

              return (
                <Box key={i} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: colorFor(winner), fontSize: '1rem' }}>
                      {winner} {Math.round(wPref).toLocaleString()}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                      {Math.round(lPref).toLocaleString()} {loser}
                    </Typography>
                  </Box>
                  <Box sx={{
                    display: 'flex',
                    height: 18,
                    borderRadius: 0.5,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'grey.100',
                  }}>
                    <Box sx={{ width: `${wWidth / 2}%`, bgcolor: colorFor(winner), transition: 'width 0.4s' }} />
                    <Box sx={{ flex: 1 }} />
                    <Box sx={{ width: `${lWidth / 2}%`, bgcolor: colorFor(loser), transition: 'width 0.4s' }} />
                  </Box>
                </Box>
              );
            })}
            <Typography variant="body1" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '1rem' }}>
              Head-to-head totals update as districts report results.
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

// ---- Step 4: Ballot Processing ---- //
const Step4BallotProcessing = () => (
  <Box>
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      <Box sx={{ width: SIDE_WIDTH }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
        >
          Instant Runoff Ballot Processing Rules
        </Typography>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
            Exhausted ballots
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '1rem' }}>
            Once all of a voter's ranked candidates have been eliminated, their ballot is
            set aside as <em>exhausted</em>. It no longer counts toward any remaining
            candidate and isn't part of the majority threshold.
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
            Skipped ranks
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '1rem' }}>
            If a voter leaves a rank blank and continues ranking below, most jurisdictions
            skip the blank and continue to the next ranked candidate. Two consecutive
            blank ranks typically exhaust the ballot.
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
            Overvotes
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
            If a voter marks two candidates at the same rank (when ties aren't allowed),
            the ballot is typically exhausted at that rank.
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ width: SIDE_WIDTH }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
        >
          Head-to-Head Ballot Processing Rules
        </Typography>

        {/* ---- H2H sub-section A: Head-to-Head ballot ---- */}
        {/* EDIT HERE: rules for processing a head-to-head ballot */}
        <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, mb: 1, fontSize: '1.1rem' }}>
            Head-to-Head Ballot
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
            Unanswered matchup
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '1rem' }}>
            A blank matchup doesn't contribute to either candidate's count in that matchup. 
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
            Ties
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
            A voter may mark both candidates in a matchup.  In this case, neither gets the vote.
          </Typography>
        </Paper>

        {/* ---- H2H sub-section B: Ranked ballot (fed into H2H tabulation) ---- */}
        {/* EDIT HERE: rules for processing a ranked ballot under the H2H method */}
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, mb: 1, fontSize: '1.1rem' }}>
            Ranked Ballot
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
            Deriving matchups from ranks
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '1rem' }}>
            For each matchup between two candidates, whichever candidate is ranked higher wins that matchup.
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
            Skipped ranks
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '1rem' }}>
            If a candidate is ranked and there are no skipped ranks above them, they
            are counted as preferred to every unranked candidate.
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
            Equal ranks
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
            Two candidates at the same rank are treated as tied in their matchup.
          </Typography>
        </Paper>
      </Box>
    </Box>

  </Box>
);

// ---- Step 5: Winner (RCV Sankey + H2H matchup bars) ---- //
// H2H-specific placement: rank by number of head-to-head wins (dense ranks).
// Rank-1 = Condorcet winner (if one exists) = green.
const computeH2HPlacement = (data) => {
  const wins = {};
  data.candidates.forEach((c) => { wins[c] = 0; });
  for (let i = 0; i < data.candidates.length; i++) {
    for (let j = i + 1; j < data.candidates.length; j++) {
      const a = data.candidates[i];
      const b = data.candidates[j];
      if (data.h2h[a][b].margin > 0) wins[a] += 1;
      else if (data.h2h[b][a].margin > 0) wins[b] += 1;
    }
  }
  const sorted = [...data.candidates].sort((a, b) => wins[b] - wins[a]);
  const placement = {};
  let currentRank = 1;
  let prevWins = null;
  sorted.forEach((c) => {
    if (prevWins !== null && wins[c] !== prevWins) currentRank += 1;
    placement[c] = currentRank;
    prevWins = wins[c];
  });
  return placement;
};

const H2HMatchupBars = ({ data }) => {
  const placement = computeH2HPlacement(data);
  const h2hColorFor = buildColorFn(placement);

  // Build pairs with a sort key that puts winner's matchups first, then runner-up's, …
  const pairs = [];
  for (let i = 0; i < data.candidates.length; i++) {
    for (let j = i + 1; j < data.candidates.length; j++) {
      const a = data.candidates[i];
      const b = data.candidates[j];
      const aWins = data.h2h[a][b].margin > 0;
      const winner = aWins ? a : b;
      const loser = aWins ? b : a;
      const minRank = Math.min(placement[a], placement[b]);
      const maxRank = Math.max(placement[a], placement[b]);
      pairs.push({
        winner,
        loser,
        winVotes: data.h2h[winner][loser].prefers,
        loseVotes: data.h2h[winner][loser].opponent_prefers,
        sortKey: minRank * 1000 + maxRank,
      });
    }
  }
  pairs.sort((a, b) => a.sortKey - b.sortKey);

  return (
    <Box>
      {pairs.map((p, i) => {
        const total = p.winVotes + p.loseVotes;
        const winPct = total ? (p.winVotes / total) * 100 : 50;
        const losePct = total ? (p.loseVotes / total) * 100 : 50;
        return (
          <Box key={i} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: h2hColorFor(p.winner), fontSize: '0.95rem' }}>
                {p.winner} {p.winVotes.toLocaleString()}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, color: h2hColorFor(p.loser), fontSize: '0.95rem' }}>
                {p.loseVotes.toLocaleString()} {p.loser}
              </Typography>
            </Box>
            <Box sx={{
              display: 'flex',
              height: 18,
              borderRadius: 0.5,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}>
              <Box sx={{ width: `${winPct}%`, bgcolor: h2hColorFor(p.winner) }} />
              <Box sx={{ width: `${losePct}%`, bgcolor: alpha(h2hColorFor(p.loser), 0.35) }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const Step5Winner = ({ data, colorFor }) => {
  const theme = useTheme();
  const winnerColor = theme.palette.success.main;
  const rcvWinner = data.rcv_winner;
  const ccWinner = data.condorcet_winner;

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* RCV side */}
        <Box sx={{ width: SIDE_WIDTH }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
          >
            Instant Runoff
          </Typography>
          <Paper sx={{
            p: 2,
            border: `2px solid ${winnerColor}`,
            bgcolor: alpha(winnerColor, 0.04),
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}>
            <TrophyIcon sx={{ fontSize: 40, color: winnerColor }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: winnerColor }}>
                {rcvWinner}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                Majority of remaining ballots after {data.rounds.length - 1} elimination
                round{data.rounds.length - 1 === 1 ? '' : 's'}.
              </Typography>
            </Box>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Sankey
              rounds={data.rounds}
              transfers={data.transfers}
              totalVotes={data.total_ballots}
              colorFor={colorFor}
            />
          </Paper>
        </Box>

        {/* Head-to-head side */}
        <Box sx={{ width: SIDE_WIDTH }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
          >
            Head-to-Head
          </Typography>
          {ccWinner ? (
            <Paper sx={{
              p: 2,
              border: `2px solid ${winnerColor}`,
              bgcolor: alpha(winnerColor, 0.04),
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}>
              <TrophyIcon sx={{ fontSize: 40, color: winnerColor }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: winnerColor }}>
                  {ccWinner}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                  Wins each of their matchups.
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                No candidate beats every other head-to-head — results form a cycle.
              </Typography>
            </Paper>
          )}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 700, mb: 1.5, fontSize: '1rem' }}>
              Head-to-head matchups
            </Typography>
            <H2HMatchupBars data={data} />
          </Paper>
        </Box>
      </Box>

      {/* Edge-case notes — one row, two equal-width boxes so heights line up */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        mt: 3,
      }}>
        <Paper variant="outlined" sx={{ width: SIDE_WIDTH, p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
            In the extremely rare case that there is a tie in the smallest number
            of first place votes, the candidate to be removed is chosen at random.
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ width: SIDE_WIDTH, p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
            In the extremely rare case that every candidate loses to another
            candidate, the winner is the candidate with the smallest loss.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

// ---- Step 6: Reporting ---- //
// Two independent reports side-by-side. Head-to-Head on the left, IRV on the right.
// Each column is what that method's election officials would publish — voters see
// only ONE of these, depending on which method is used.
const Step6Reporting = ({ data }) => {
  const sampleBallots = (WALKTHROUGH_BALLOTS[data.candidates.length] || []).slice(0, 4);
  const cvrRows = [];
  sampleBallots.forEach((b, idx) => {
    for (let i = 0; i < Math.min(2, b.count); i++) {
      cvrRows.push({ id: `B-${idx}-${i + 1}`, ranking: b.ranking });
    }
  });

  const pairs = [];
  for (let i = 0; i < data.candidates.length; i++) {
    for (let j = i + 1; j < data.candidates.length; j++) {
      pairs.push([data.candidates[i], data.candidates[j]]);
    }
  }

  // For each sample ballot, derive the pairwise answer it contributes
  // (used in the H2H CVR example).
  const pairwisePick = (ranking, a, b) => {
    const ra = ranking[a], rb = ranking[b];
    if (ra !== undefined && rb !== undefined) return ra < rb ? a : (ra > rb ? b : 'tie');
    if (ra !== undefined) return a;
    if (rb !== undefined) return b;
    return '—';
  };

  const reportSection = (title, body) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>{title}</Typography>
      {body}
    </Box>
  );

  const summaryRow = (label, value) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body1" sx={{ fontSize: '1rem' }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>{value}</Typography>
    </Box>
  );

  return (
    <Box>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3,
      }}>
        {/* ============ Head-to-Head report (RIGHT) ============ */}
        <Box sx={{ order: 2 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
          >
            Head-to-Head Report
          </Typography>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            {reportSection(
              'Summary',
              <Box>
                {summaryRow('Total ballots', data.total_ballots.toLocaleString())}
                {summaryRow('Candidates', data.candidates.length)}
                {summaryRow('Winner', data.condorcet_winner || 'no Condorcet winner')}
                {summaryRow('Method', 'Head-to-Head')}
              </Box>
            )}

            {reportSection(
              'Pairwise Matrix',
              <Box sx={{ overflowX: 'auto' }}>
                <Typography variant="body1" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontSize: '1rem' }}>
                  Signed margin (row beats column by +N votes).
                </Typography>
                <Box component="table" sx={{ borderCollapse: 'collapse', fontSize: '0.8rem', width: '100%' }}>
                  <Box component="thead">
                    <Box component="tr">
                      <Box component="th" sx={{ textAlign: 'left', p: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}></Box>
                      {data.candidates.map((c) => (
                        <Box component="th" key={c} sx={{ p: 0.75, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center', fontWeight: 700 }}>
                          vs {c}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {data.candidates.map((a) => (
                      <Box component="tr" key={a}>
                        <Box component="td" sx={{ p: 0.75, fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>{a}</Box>
                        {data.candidates.map((b) => {
                          if (a === b) return <Box component="td" key={b} sx={{ p: 0.75, textAlign: 'center', color: 'text.disabled', borderBottom: '1px solid', borderColor: 'divider' }}>—</Box>;
                          const m = data.h2h[a][b].margin;
                          return (
                            <Box component="td" key={b} sx={{ p: 0.75, textAlign: 'center', color: m > 0 ? 'success.main' : 'error.main', borderBottom: '1px solid', borderColor: 'divider' }}>
                              {m > 0 ? `+${m.toLocaleString()}` : m.toLocaleString()}
                            </Box>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {reportSection(
              'Cast Vote Records (H2H)',
              <Box>
                <Typography variant="body1" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontSize: '1rem' }}>
                  Each ballot's pairwise answers — anonymized.
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.75rem', overflowX: 'auto' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5, mb: 0.5 }}>
                    <Box sx={{ width: 48 }}>Ballot</Box>
                    {pairs.map(([a, b]) => (
                      <Box key={`${a}|${b}`} sx={{ flex: 1, textAlign: 'center' }}>
                        {a} vs {b}
                      </Box>
                    ))}
                  </Box>
                  {cvrRows.map((row) => (
                    <Box key={row.id} sx={{ display: 'flex', gap: 1.5, py: 0.2 }}>
                      <Box sx={{ width: 48, color: 'text.secondary' }}>{row.id}</Box>
                      {pairs.map(([a, b]) => (
                        <Box key={`${a}|${b}`} sx={{ flex: 1, textAlign: 'center' }}>
                          {pairwisePick(row.ranking, a, b)}
                        </Box>
                      ))}
                    </Box>
                  ))}
                  <Box sx={{ mt: 0.5, color: 'text.secondary' }}>…</Box>
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>

        {/* ============ IRV report (LEFT) ============ */}
        <Box sx={{ order: 1 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
          >
            Instant Runoff Report
          </Typography>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            {reportSection(
              'Summary',
              <Box>
                {summaryRow('Ballots received', (data.total_ballots + (data.overvotes || 0) + (data.undervotes || 0)).toLocaleString())}
                {summaryRow('Candidates', data.candidates.length)}
                {summaryRow('Winner', data.rcv_winner)}
                {summaryRow('Rounds', data.rounds.length)}
                {summaryRow('Method', 'Instant Runoff')}
              </Box>
            )}

            {reportSection(
              'Ballot Overview',
              <Box>
                <Typography variant="body1" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontSize: '1rem' }}>
                  How ballots break down <em>before</em> Round 1 begins.
                </Typography>
                {summaryRow('Ballots received', (data.total_ballots + (data.overvotes || 0) + (data.undervotes || 0)).toLocaleString())}
                {summaryRow('— Overvotes (two marks at same rank)', (data.overvotes || 0).toLocaleString())}
                {summaryRow('— Undervotes (blank first choice)', (data.undervotes || 0).toLocaleString())}
                {summaryRow('Active ballots (counted in Round 1)', data.total_ballots.toLocaleString())}
              </Box>
            )}

            {reportSection(
              'Round-by-Round Tally',
              <Box>
                {(() => {
                  let cumulativeExhausted = 0;
                  return data.rounds.map((r, i) => {
                    const t = data.transfers[i];
                    const transferEntries = t
                      ? Object.entries(t.transfers).filter(([, v]) => v > 0)
                      : [];
                    const activeThisRound = Object.values(r.tallies).reduce((s, v) => s + v, 0);
                    if (t) cumulativeExhausted += t.exhausted;
                    const cumulativeAfter = cumulativeExhausted;
                    return (
                      <Box key={r.round} sx={{ mb: 1, pb: 1, borderBottom: i < data.rounds.length - 1 ? '1px dashed' : 'none', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Round {r.round}</Typography>
                        {Object.entries(r.tallies).sort((a, b) => b[1] - a[1]).map(([c, v]) => (
                          <Box key={c} sx={{ display: 'flex', justifyContent: 'space-between', pl: 1.5, py: 0.2 }}>
                            <Typography variant="caption">{c}</Typography>
                            <Typography variant="caption">{Math.round(v).toLocaleString()}</Typography>
                          </Box>
                        ))}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1.5, py: 0.2, borderTop: '1px dotted', borderColor: 'divider', mt: 0.3 }}>
                          <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>Active this round</Typography>
                          <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>{Math.round(activeThisRound).toLocaleString()}</Typography>
                        </Box>
                        {t && (
                          <Box sx={{ pl: 1.5, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>
                              → {t.eliminated} eliminated — ballots transfer:
                            </Typography>
                            {transferEntries.map(([cand, v]) => (
                              <Box key={cand} sx={{ display: 'flex', justifyContent: 'space-between', pl: 1.5, py: 0.15 }}>
                                <Typography variant="caption" color="text.secondary">to {cand}</Typography>
                                <Typography variant="caption" color="text.secondary">+{Math.round(v).toLocaleString()}</Typography>
                              </Box>
                            ))}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1.5, py: 0.15 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>exhausted this round</Typography>
                              <Typography variant="caption" color="text.secondary">+{Math.round(t.exhausted).toLocaleString()}</Typography>
                            </Box>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1.5, py: 0.15, mt: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Cumulative exhausted</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{Math.round(cumulativeAfter).toLocaleString()}</Typography>
                        </Box>
                      </Box>
                    );
                  });
                })()}
              </Box>
            )}

            {reportSection(
              'Cast Vote Records (ranked)',
              <Box>
                <Typography variant="body1" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontSize: '1rem' }}>
                  Each ballot's ranks — anonymized.
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.75rem', overflowX: 'auto' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5, mb: 0.5 }}>
                    <Box sx={{ width: 48 }}>Ballot</Box>
                    {data.candidates.map((c) => (
                      <Box key={c} sx={{ flex: 1, textAlign: 'center' }}>{c}</Box>
                    ))}
                  </Box>
                  {cvrRows.map((row) => (
                    <Box key={row.id} sx={{ display: 'flex', gap: 1.5, py: 0.2 }}>
                      <Box sx={{ width: 48, color: 'text.secondary' }}>{row.id}</Box>
                      {data.candidates.map((c) => (
                        <Box key={c} sx={{ flex: 1, textAlign: 'center' }}>
                          {row.ranking[c] ?? '—'}
                        </Box>
                      ))}
                    </Box>
                  ))}
                  <Box sx={{ mt: 0.5, color: 'text.secondary' }}>…</Box>
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export const SplitScreenCompare = () => {
  const [step, setStep] = useState(0);
  const [topK, setTopK] = useState(3);

  // All data-dependent steps (Election Night onward) use synthetic ballots
  // determined by the current top-k selection.
  const walkData = useMemo(() => buildWalkthroughData(topK), [topK]);
  const walkColorFor = useMemo(() => {
    const placement = computePlacement(walkData.rounds, walkData.transfers, walkData.rcv_winner);
    return buildColorFn(placement);
  }, [walkData]);

  const renderStep = () => {
    switch (step) {
      case 0: return <Step1Primary topK={topK} onTopKChange={setTopK} />;
      case 1: return <Step2Ballots topK={topK} />;
      case 2: return <Step3ElectionNight data={walkData} colorFor={walkColorFor} />;
      case 3: return <Step4BallotProcessing />;
      case 4: return <Step5Winner data={walkData} colorFor={walkColorFor} />;
      case 5: return <Step6Reporting data={walkData} />;
      default: return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {STEP_LABELS.map((label, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Circle + label together form one clickable target */}
            <Box
              onClick={() => setStep(idx)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                cursor: 'pointer',
                px: 0.75,
                py: 0.5,
                borderRadius: 1,
                transition: 'background-color 0.15s',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box
                sx={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700,
                  bgcolor: idx <= step ? 'primary.main' : 'grey.200',
                  color: idx <= step ? 'white' : 'text.secondary',
                }}
              >
                {idx + 1}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: idx === step ? 700 : 400,
                  color: idx <= step ? 'text.primary' : 'text.secondary',
                  userSelect: 'none',
                }}
              >
                {label}
              </Typography>
            </Box>
            {idx < STEP_LABELS.length - 1 && (
              <Box sx={{ width: 20, height: 2, bgcolor: idx < step ? 'primary.main' : 'grey.200' }} />
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ minHeight: 360 }}>
        {renderStep()}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
        <Button
          size="small"
          startIcon={<BackIcon />}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          sx={{ textTransform: 'none' }}
        >
          Back
        </Button>
        <Button
          size="small"
          endIcon={<NextIcon />}
          variant="outlined"
          onClick={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))}
          disabled={step === STEP_LABELS.length - 1}
          sx={{ textTransform: 'none' }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

// ----------------------------------------------------------------
// Main page
// ----------------------------------------------------------------
const CompareMethods = () => {
  const location = useLocation();
  const isEmbedded = new URLSearchParams(location.search).get('embedded') === 'true';
  const [tab, setTab] = useState(0);
  const [selectedKey, setSelectedKey] = useState(DEFAULT_PRESET_KEY);
  const defaultPreset = PRESETS.find((p) => p.key === DEFAULT_PRESET_KEY);
  const [dataSource, setDataSource] = useState({ name: defaultPreset.name, csv: defaultPreset.csv });
  const [error, setError] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const fileRef = useRef(null);

  const data = useMemo(() => {
    try {
      const parsed = parseRankingsCsv(dataSource.csv);
      return computeComparisonData(parsed, dataSource.name);
    } catch (e) {
      setError(e.message || String(e));
      return null;
    }
  }, [dataSource]);

  const colorFor = useMemo(
    () => (data ? makeColorFn(data.candidates) : makeColorFn([])),
    [data]
  );

  const handleUpload = (file) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const name = file.name.replace(/\.csv$/i, '');
      try {
        parseRankingsCsv(text);
        setSelectedKey('__uploaded__');
        setDataSource({ name, csv: text });
      } catch (err) {
        setError(err.message || String(err));
      }
    };
    reader.readAsText(file);
  };

  const handlePresetChange = (key) => {
    setError(null);
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setSelectedKey(key);
    setDataSource({ name: preset.name, csv: preset.csv });
  };

  const consensusResults = data ? buildConsensusResults(data) : null;

  return (
    <Box sx={{ pt: isEmbedded ? '20px' : '180px', pb: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Head-to-Head vs. Instant Runoff vs. Plurality
          </Typography>
        </Box>

        {/* Two-column intro: scenario on the left, walkthrough call-out on the right */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'stretch',
          mb: 3,
        }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, textAlign: 'center', fontSize: { xs: '1.2rem', sm: '1.4rem' } }}
            >
              Top 3 candidates chosen in a Primary
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            component={RouterLink}
            to="/compare-methods/walkthrough"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2.5,
              textDecoration: 'none',
              color: 'inherit',
              border: '2px solid transparent',
              transition: 'border-color 0.2s, background-color 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                From Ballots to Winners
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compare different elections with top 2, 3, 4, or 5
              </Typography>
            </Box>
            <NextIcon sx={{ color: 'primary.main' }} />
          </Paper>
        </Box>

        {/* Dataset selector */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel id="preset-label">Example</InputLabel>
            <Select
              labelId="preset-label"
              label="Example"
              value={selectedKey}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              {PRESETS.map((p) => (
                <MenuItem key={p.key} value={p.key}>{p.name}</MenuItem>
              ))}
              {selectedKey === '__uploaded__' && (
                <MenuItem value="__uploaded__" disabled>
                  Uploaded: {dataSource.name}
                </MenuItem>
              )}
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileRef.current && fileRef.current.click()}
            sx={{ textTransform: 'none' }}
          >
            Upload ranked CSV
          </Button>
          <Tooltip title="CSV format help">
            <IconButton size="small" onClick={() => setHelpOpen(true)}>
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {selectedKey === '__uploaded__' && (
            <Button
              size="small"
              startIcon={<RestoreIcon />}
              onClick={() => handlePresetChange(DEFAULT_PRESET_KEY)}
              sx={{ textTransform: 'none' }}
            >
              Reset
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {data && (
          <Box>
            <Paper variant="outlined" sx={{ mb: 3 }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="fullWidth"
                sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Tab label="Head-to-Head Winner" />
                <Tab label="Instant Runoff Winner" />
                <Tab label="Plurality Winner" />
              </Tabs>
            </Paper>

            {tab === 0 && (
              <Box sx={{ mb: 4 }}>
                <ResultsDisplay results={consensusResults} poll={null} />
              </Box>
            )}
            {tab === 1 && (
              <Box sx={{ mb: 4 }}>
                <RCVRoundsDisplay data={data} />
              </Box>
            )}
            {tab === 2 && (
              <Box sx={{ mb: 4 }}>
                <PluralityDisplay data={data} />
              </Box>
            )}
          </Box>
        )}

        {/* CSV format help dialog */}
        <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>CSV format</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph>
              The first column must be <strong>Count</strong> (number of voters with this ranking).
              Remaining columns are candidate names. Each cell contains the rank
              (<strong>1</strong> = most preferred). Leave a cell blank if the voter did not rank that candidate.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre' }}>
{`Count,Alice,Bob,Carla
1200,1,2,3
800,2,1,
450,,1,2
300,1,,2`}
            </Paper>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Head-to-head comparisons use extended strict preference: unranked candidates
              are treated as tied last.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHelpOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CompareMethods;
