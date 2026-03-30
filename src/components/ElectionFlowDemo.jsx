// components/ElectionFlowDemo.jsx
// Animated demonstration of the full Consensus Choice election process
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Radio,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Replay as ReplayIcon,
  Description as BallotIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { OHIO_COUNTIES, OHIO_SVG_WIDTH, OHIO_SVG_HEIGHT } from '../assets/ohioCounties';

// ============================================================
// DATA
// ============================================================

const ALL_CANDIDATES = [
  { name: 'Ana', color: '#7B1FA2' },    // Purple (winner)
  { name: 'Bob', color: '#00695C' },    // Teal
  { name: 'Carla', color: '#E65100' },  // Burnt orange
  { name: 'Dan', color: '#43A047' },    // Medium green
  { name: 'Eve', color: '#546E7A' },    // Steel grey
  { name: 'Frank', color: '#5D4037' },  // Warm brown
  { name: 'Grace', color: '#8E6B8D' },  // Dusty mauve
  { name: 'Hank', color: '#827717' },   // Olive gold
];

// Primary growth: each candidate has a final % and a single smooth power curve.
// Lower exponent = faster early growth. Higher = slower start, late surge.
// Designed so lead changes happen naturally:
//   t~0.05: Dan leads (fast early curve + decent final %)
//   t~0.15: Ana overtakes Dan
//   t~0.60: Carla leads Bob
//   t~0.80: Bob surges past Carla
const PRIMARY_CANDIDATES = [
  { name: 'Ana',   final: 28, exp: 0.8  },  // Steady strong growth
  { name: 'Bob',   final: 24, exp: 1.8  },  // Very slow start, big late surge
  { name: 'Carla', final: 19, exp: 0.75 },  // Solid early, holds steady
  { name: 'Dan',   final: 10, exp: 0.35 },  // Very fast early, leads briefly
  { name: 'Eve',   final: 8,  exp: 1.1  },  // Slightly late bloomer
  { name: 'Frank', final: 5,  exp: 0.5  },  // Quick early showing
  { name: 'Grace', final: 4,  exp: 1.0  },  // Linear
  { name: 'Hank',  final: 2,  exp: 0.4  },  // Fast start, tiny total
];

const TOP_3 = ['Ana', 'Bob', 'Carla'];

// Final head-to-head results
// Ana beats Bob 54-46, Ana beats Carla 52-48, Carla beats Bob 53-47
const FINAL_H2H = [
  { label: 'Ana vs Bob', winner: 'Ana', winPct: 54, losePct: 46, winColor: '#9C27B0', loseColor: '#00897B', loser: 'Bob' },
  { label: 'Ana vs Carla', winner: 'Ana', winPct: 52, losePct: 48, winColor: '#9C27B0', loseColor: '#EF6C00', loser: 'Carla' },
  { label: 'Bob vs Carla', winner: 'Carla', winPct: 53, losePct: 47, winColor: '#EF6C00', loseColor: '#00897B', loser: 'Bob' },
];

// Deterministic shuffle of county indices for animation order
const COUNTY_ORDER = (() => {
  const indices = OHIO_COUNTIES.map((_, i) => i);
  // Seeded shuffle so it's the same every time
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
})();

// ============================================================
// STEP COMPONENTS
// ============================================================

const StepIndicator = ({ currentStep, totalSteps, stepLabels }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
    {stepLabels.map((label, idx) => (
      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box
          sx={{
            width: 28, height: 28, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700,
            bgcolor: idx <= currentStep ? 'primary.main' : 'grey.200',
            color: idx <= currentStep ? 'white' : 'text.secondary',
            transition: 'all 0.4s ease',
          }}
        >
          {idx + 1}
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: idx === currentStep ? 600 : 400,
            color: idx <= currentStep ? 'text.primary' : 'text.secondary',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          {label}
        </Typography>
        {idx < totalSteps - 1 && (
          <Box
            sx={{
              width: { xs: 16, sm: 32 }, height: 2,
              bgcolor: idx < currentStep ? 'primary.main' : 'grey.200',
              transition: 'all 0.4s ease', mx: 0.5,
            }}
          />
        )}
      </Box>
    ))}
  </Box>
);

// ----------------------------------------------------------------
// Step 1: Primary — bars grow at different rates, re-sort live
// ----------------------------------------------------------------
const ROW_HEIGHT = 32; // px per candidate row

const PrimaryStep = ({ progress, showElimination }) => {
  // Calculate current vote for each candidate using smooth power curve
  const currentVotes = PRIMARY_CANDIDATES.map(c => {
    const candData = ALL_CANDIDATES.find(a => a.name === c.name);
    const currentPct = c.final * Math.pow(Math.max(progress, 0), c.exp);
    return {
      name: c.name,
      color: candData?.color || '#666',
      currentPct,
    };
  });

  // Determine sort rank for each candidate (by currentPct desc, then alpha)
  const withRank = [...currentVotes].sort((a, b) => {
    const diff = b.currentPct - a.currentPct;
    if (Math.abs(diff) < 0.001) return a.name.localeCompare(b.name);
    return diff;
  });
  const rankMap = {};
  withRank.forEach((c, idx) => { rankMap[c.name] = idx; });

  // Bar widths scaled to a fixed max so they directly represent percentages
  // Using 40 as the scale max — a 28% result shows as 70% bar width
  const barScale = 40;
  const reportingPct = Math.round(progress * 100);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, textAlign: 'center', fontSize: '1.4rem' }}>
        Primary Election
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5, textAlign: 'center' }}>
        8 candidates compete. The top 3 advance to the general election.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
        {progress > 0 ? `${reportingPct}% reporting` : '\u00A0'}
      </Typography>

      <Box sx={{ maxWidth: 420, mx: 'auto', position: 'relative', height: ROW_HEIGHT * 8 }}>
        {/* Render all candidates in fixed DOM order, position via transform */}
        {currentVotes.map((candidate) => {
          const rank = rankMap[candidate.name];
          const isTop3 = TOP_3.includes(candidate.name);
          const barWidth = (candidate.currentPct / barScale) * 100;
          const eliminated = showElimination && !isTop3;
          const displayPct = Math.round(candidate.currentPct);

          return (
            <Box
              key={candidate.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                position: 'absolute',
                left: 0,
                right: 0,
                height: ROW_HEIGHT,
                transform: `translateY(${rank * ROW_HEIGHT}px)`,
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 1s ease',
                opacity: eliminated ? 0.18 : 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  width: 60,
                  fontWeight: 500,
                  color: candidate.color,
                  flexShrink: 0,
                  fontSize: '0.95rem',
                }}
              >
                {candidate.name}
              </Typography>
              <Box sx={{ flex: 1, mx: 1, height: 20 }}>
                <Box
                  sx={{
                    height: 20,
                    borderRadius: 0.5,
                    bgcolor: candidate.color,
                    width: `${barWidth}%`,
                    minWidth: progress > 0 ? 2 : 0,
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  minWidth: 32,
                  textAlign: 'right',
                  fontWeight: 500,
                }}
              >
                {displayPct > 0 ? `${displayPct}%` : ''}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ textAlign: 'center', mt: 2, opacity: showElimination ? 1 : 0, transition: 'opacity 0.6s ease', height: 28 }}>
        <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Advancing to the general election: Ana, Bob, and Carla
        </Typography>
      </Box>
    </Box>
  );
};

// ----------------------------------------------------------------
// Step 2: Pairwise Ballot — 3 ballots filled in and stacked
// ----------------------------------------------------------------

const BALLOT_MATCHUPS = [
  { cand1: 'Ana', cand2: 'Bob' },
  { cand1: 'Ana', cand2: 'Carla' },
  { cand1: 'Bob', cand2: 'Carla' },
];

// 3 voters' choices
const BALLOT_VOTERS = [
  // Voter 1: Ana > Bob, Ana > Carla, Carla > Bob
  [{ c1: true, c2: false }, { c1: true, c2: false }, { c1: false, c2: true }],
  // Voter 2: Bob > Ana, Ana > Carla, Bob > Carla
  [{ c1: false, c2: true }, { c1: true, c2: false }, { c1: true, c2: false }],
  // Voter 3: Ana > Bob, Carla > Ana, Carla > Bob
  [{ c1: true, c2: false }, { c1: false, c2: true }, { c1: false, c2: true }],
];

// Each ballot gets 1/3 of progress. Within that:
//   0.00-0.05: ballot appears
//   0.05-0.15: matchup 1 filled
//   0.15-0.25: matchup 2 filled
//   0.25-0.35: matchup 3 filled
//   0.35-0.45: pause, then shrink to pile
const BALLOT_PHASE = 1 / 5;

// highlightMatchup: index of matchup to highlight (or -1 for none)
const BallotCard = ({ matchups, choices, fillProgress, inPile, pileOffset, highlightMatchup = -1 }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      width: inPile ? 100 : '100%',
      transform: inPile
        ? `translate(${pileOffset?.x || 0}px, ${pileOffset?.y || 0}px)`
        : 'none',
      opacity: inPile ? 0.6 : 1,
      transition: 'all 0.6s ease',
      bgcolor: 'background.paper',
      ...(inPile ? {
        position: 'absolute',
        '& *': { fontSize: '0.45rem !important' },
        '& .MuiRadio-root': { p: '1px', mr: '2px' },
        '& .MuiSvgIcon-root': { fontSize: '10px !important' },
      } : {}),
    }}
  >
    {matchups.map((m, idx) => {
      const filled = fillProgress > idx;
      const sel = filled ? choices[idx] : { c1: false, c2: false };
      const isHighlighted = highlightMatchup === idx;
      return (
        <Box key={idx}>
          {idx > 0 && <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: inPile ? 0.25 : 1 }} />}
          <Box sx={{
            py: inPile ? 0 : 0.5,
            px: inPile ? 0 : 0.5,
            borderRadius: 1,
            bgcolor: isHighlighted ? 'action.hover' : 'transparent',
            transition: 'background-color 0.3s ease',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', py: inPile ? 0 : 0.3 }}>
              <Radio checked={sel.c1} disabled size="small" sx={{ p: 0.3, mr: 0.75, '& .MuiSvgIcon-root': { fontSize: 22 } }} />
              <Typography variant="body1" sx={{ fontWeight: sel.c1 ? 600 : 400 }}>{m.cand1}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', py: inPile ? 0 : 0.3 }}>
              <Radio checked={sel.c2} disabled size="small" sx={{ p: 0.3, mr: 0.75, '& .MuiSvgIcon-root': { fontSize: 22 } }} />
              <Typography variant="body1" sx={{ fontWeight: sel.c2 ? 600 : 400 }}>{m.cand2}</Typography>
            </Box>
          </Box>
        </Box>
      );
    })}
  </Paper>
);

const PairwiseBallotStep = ({ progress }) => {
  // First ballot gets 35%. Ballots 2-3 share 35% (more time each). Last 30% is counting-up.
  const FIRST_SHARE = 0.35;
  const FAST_SHARE = 0.35;
  const EACH_FAST = FAST_SHARE / 2;
  const DONE_SHARE = 0.30;

  let activeBallot, ballotProgress, doneProgress;
  doneProgress = 0;
  if (progress < FIRST_SHARE) {
    activeBallot = 0;
    ballotProgress = progress / FIRST_SHARE;
  } else if (progress < FIRST_SHARE + FAST_SHARE) {
    const remaining = progress - FIRST_SHARE;
    activeBallot = 1 + Math.floor(remaining / EACH_FAST);
    ballotProgress = (remaining - (activeBallot - 1) * EACH_FAST) / EACH_FAST;
    activeBallot = Math.min(activeBallot, 2);
  } else {
    activeBallot = 3; // all done
    ballotProgress = 1;
    doneProgress = Math.min((progress - FIRST_SHARE - FAST_SHARE) / DONE_SHARE, 1);
  }

  const pilePositions = [
    { x: 3, y: 6 },
    { x: -2, y: 3 },
    { x: 1, y: 0 },
  ];

  // First ballot: highlight then fill, one matchup at a time
  // Timeline for ballot 0: 0-0.12 highlight m1, 0.12-0.22 fill m1,
  //   0.22-0.32 highlight m2, 0.32-0.42 fill m2,
  //   0.42-0.52 highlight m3, 0.52-0.62 fill m3,
  //   0.62-0.85 pause, 0.85-1.0 shrink
  let fillCount, highlightMatchup;

  if (activeBallot === 0) {
    // Ballot 1 (slow, with highlighting):
    // Highlight moves smoothly from matchup to matchup — no gaps.
    // 0.00-0.08: blank ballot appears
    // 0.08-0.20: highlight m1
    // 0.20-0.28: fill m1 (still highlighted)
    // 0.28-0.40: highlight m2 (m1 stays filled)
    // 0.40-0.48: fill m2 (still highlighted)
    // 0.48-0.58: highlight m3
    // 0.58-0.66: fill m3 (still highlighted)
    // 0.58-0.75: pause — completed ballot stays visible
    // 0.75+: shrink
    if (ballotProgress < 0.08) {
      fillCount = 0; highlightMatchup = -1;
    } else if (ballotProgress < 0.18) {
      fillCount = 0; highlightMatchup = 0;
    } else if (ballotProgress < 0.26) {
      fillCount = 1; highlightMatchup = 0;
    } else if (ballotProgress < 0.36) {
      fillCount = 1; highlightMatchup = 1;
    } else if (ballotProgress < 0.44) {
      fillCount = 2; highlightMatchup = 1;
    } else if (ballotProgress < 0.52) {
      fillCount = 2; highlightMatchup = 2;
    } else if (ballotProgress < 0.58) {
      fillCount = 3; highlightMatchup = 2;
    } else {
      fillCount = 3; highlightMatchup = -1;
    }
  } else if (activeBallot <= 2) {
    // Ballots 2-3: pause, fill, longer pause, shrink
    // 0.00-0.12: blank ballot visible (pause)
    // 0.12-0.25: fill m1
    // 0.25-0.38: fill m2
    // 0.38-0.50: fill m3
    // 0.50-0.75: pause — completed ballot stays visible
    // 0.75+: shrink
    if (ballotProgress < 0.12) {
      fillCount = 0;
    } else if (ballotProgress < 0.25) {
      fillCount = 1;
    } else if (ballotProgress < 0.38) {
      fillCount = 2;
    } else {
      fillCount = 3;
    }
    highlightMatchup = -1;
  } else {
    fillCount = 3;
    highlightMatchup = -1;
  }

  const isShrinking = activeBallot === 0 ? ballotProgress > 0.75 : (activeBallot <= 2 ? ballotProgress > 0.75 : false);
  const allDone = activeBallot >= 3;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, textAlign: 'center', fontSize: '1.4rem' }}>
        Head-to-Head Voting
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        Voters pick their preferred candidate in each matchup.
      </Typography>

      <Box sx={{
        display: 'flex',
        gap: 3,
        maxWidth: 480,
        mx: 'auto',
        height: 260,
        alignItems: 'flex-start',
        position: 'relative',
      }}>
        {/* Left: active ballot area */}
        <Box sx={{ flex: '0 0 62%', position: 'relative', height: '100%' }}>
          {/* Active ballot — keyed by activeBallot so React creates a fresh element */}
          {activeBallot < 3 && !allDone && (
            <Box
              key={`ballot-${activeBallot}`}
              sx={{
                transform: isShrinking
                  ? 'scale(0.3) translate(140%, 60%)'
                  : 'scale(1) translate(0, 0)',
                opacity: isShrinking
                  ? 0
                  : (ballotProgress < 0.04 ? 0 : 1),
                transition: isShrinking
                  ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease'
                  : 'opacity 0.4s ease',
                transformOrigin: 'center center',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <BallotCard
                matchups={BALLOT_MATCHUPS}
                choices={BALLOT_VOTERS[activeBallot]}
                fillProgress={fillCount}
                inPile={false}
                highlightMatchup={highlightMatchup}
              />
            </Box>
          )}

          {/* "All done" message */}
          {allDone && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.8s ease forwards',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', textAlign: 'center' }}>
                All voters submit their<br />head-to-head comparisons
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right: ballot icon + counter */}
        <Box sx={{
          flex: '0 0 30%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {(() => {
            const baseCount = Math.min(activeBallot + (isShrinking ? 1 : 0), 3);
            const displayCount = allDone
              ? Math.round(3 + doneProgress * doneProgress * 7580952)
              : baseCount;

            return (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}>
                <BallotIcon sx={{
                  fontSize: allDone ? 48 : 40,
                  color: allDone ? 'primary.main' : 'text.secondary',
                  transition: 'all 0.3s ease',
                }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: allDone ? 'primary.main' : 'text.secondary',
                    fontSize: allDone ? '0.95rem' : '0.8rem',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {displayCount.toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  ballots cast
                </Typography>
              </Box>
            );
          })()}
        </Box>
      </Box>
    </Box>
  );
};

// ----------------------------------------------------------------
// Step 3: Precincts Reporting
// ----------------------------------------------------------------
const PrecinctsStep = ({ progress }) => {
  const theme = useTheme();
  const litCount = Math.floor(progress * OHIO_COUNTIES.length);
  const litSet = new Set(COUNTY_ORDER.slice(0, litCount));

  return (
    <Box sx={{
      animation: 'countiesFadeIn 0.8s ease forwards',
      '@keyframes countiesFadeIn': {
        from: { opacity: 0, transform: 'translateY(8px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
    }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, textAlign: 'center', fontSize: '1.4rem' }}>
        Counties Report
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        As results come in from across Ohio, the head-to-head totals grow.
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 3,
        maxWidth: 600,
        mx: 'auto',
      }}>
        {/* Ohio County Map — aspect-ratio corrected */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg
            viewBox={`0 0 ${OHIO_SVG_WIDTH} ${OHIO_SVG_HEIGHT}`}
            width="240"
            height={Math.round(240 * OHIO_SVG_HEIGHT / OHIO_SVG_WIDTH)}
            style={{ overflow: 'visible' }}
          >
            {OHIO_COUNTIES.map((county, idx) => (
              <path
                key={county.id}
                d={county.path}
                fill={litSet.has(idx)
                  ? alpha(theme.palette.primary.main, 0.5)
                  : alpha(theme.palette.grey[300], 0.3)
                }
                stroke={theme.palette.divider}
                strokeWidth="0.6"
                style={{ transition: 'fill 0.4s ease' }}
              />
            ))}
          </svg>
        </Box>

        {/* Growing bars — from both sides */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, justifyContent: 'center' }}>
          {FINAL_H2H.map((bar, idx) => {
            const barProgress = Math.min(progress * (1 + idx * 0.05), 1);
            const winPct = bar.winPct * barProgress;
            const losePct = bar.losePct * barProgress;
            const total = winPct + losePct;
            // Width as proportion of total, so they meet in the middle
            const winWidth = total > 0 ? (winPct / 100) * 100 : 0;
            const loseWidth = total > 0 ? (losePct / 100) * 100 : 0;

            return (
              <Box key={idx}>
                {/* Labels */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: bar.winColor }}>
                    {bar.winner} {barProgress > 0.2 ? `${Math.round(winPct)}%` : ''}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: bar.loseColor }}>
                    {barProgress > 0.2 ? `${Math.round(losePct)}%` : ''} {bar.loser}
                  </Typography>
                </Box>
                {/* Bar — winner grows from left, loser grows from right */}
                <Box sx={{
                  display: 'flex', height: 24, borderRadius: 0.5, overflow: 'hidden',
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: 'grey.100',
                }}>
                  {/* Winner from left */}
                  <Box sx={{
                    width: `${winWidth}%`,
                    bgcolor: bar.winColor,
                    borderRadius: '3px 0 0 3px',
                  }} />
                  {/* Gap in the middle */}
                  <Box sx={{ flex: 1 }} />
                  {/* Loser from right */}
                  <Box sx={{
                    width: `${loseWidth}%`,
                    bgcolor: bar.loseColor,
                    borderRadius: '0 3px 3px 0',
                  }} />
                </Box>
              </Box>
            );
          })}

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
            {litCount} of {OHIO_COUNTIES.length} counties reporting
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ----------------------------------------------------------------
// Step 4: Winner
// ----------------------------------------------------------------
const WinnerStep = () => {
  const annColor = '#9C27B0';

  return (
    <Box sx={{
      textAlign: 'center',
      animation: 'winnerFadeIn 0.8s ease forwards',
      '@keyframes winnerFadeIn': {
        from: { opacity: 0, transform: 'translateY(8px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
    }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, textAlign: 'center', fontSize: '1.4rem' }}>
        The Winner
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
        The candidate who wins every head-to-head comparison.
      </Typography>

      {/* Winner */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
        <TrophyIcon sx={{ fontSize: 44, color: annColor }} />
        <Typography variant="h3" sx={{ fontWeight: 700, color: annColor }}>
          Ana
        </Typography>
      </Box>

      {/* Head-to-head bars */}
      <Box sx={{ maxWidth: 360, mx: 'auto' }}>
        {FINAL_H2H.map((bar, idx) => {
          const isAnaMatchup = bar.winner === 'Ana';
          return (
            <Box
              key={idx}
              sx={{
                mb: 1,
                px: 1,
                py: 0.75,
                borderRadius: 1,
                border: '1px solid',
                borderColor: isAnaMatchup ? alpha(annColor, 0.3) : 'divider',
                bgcolor: isAnaMatchup ? alpha(annColor, 0.04) : 'transparent',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: bar.winColor,
                  }}
                >
                  {bar.winner} {bar.winPct}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 400,
                    color: bar.loseColor,
                  }}
                >
                  {bar.losePct}% {bar.loser}
                </Typography>
              </Box>
              <Box sx={{
                display: 'flex', height: 14, borderRadius: 0.5, overflow: 'hidden',
                bgcolor: 'grey.100',
              }}>
                <Box sx={{ width: `${bar.winPct}%`, bgcolor: bar.winColor }} />
                <Box sx={{ flex: 1 }} />
                <Box sx={{ width: `${bar.losePct}%`, bgcolor: bar.loseColor }} />
              </Box>
              <Typography variant="caption" sx={{
                color: isAnaMatchup ? annColor : 'text.secondary',
                fontWeight: isAnaMatchup ? 500 : 400,
                mt: 0.25,
                display: 'block',
              }}>
                {bar.winner} wins
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const STEP_LABELS = ['Primary', 'Voting', 'Results', 'Winner'];

// Duration in ms for each step's animation
const STEP_DURATIONS = [6000, 12000, 9000, 4000];
const PAUSE_BETWEEN_STEPS = 1000;

// Easing for primary step: slow start, accelerates smoothly
const primaryEasing = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return Math.pow(t, 1.6);
};

// Easing for counties step: initial pause, then slow start, then accelerates
const countiesEasing = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // First 10% of time = nothing happens (pause for fade-in)
  if (t < 0.1) return 0;
  // Remap remaining 90% with acceleration
  const adjusted = (t - 0.1) / 0.9;
  return Math.pow(adjusted, 1.8);
};

const ElectionFlowDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showElimination, setShowElimination] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  const totalSteps = 4;

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  const runAnimation = useCallback((step) => {
    const duration = STEP_DURATIONS[step];
    startTimeRef.current = null;
    setIsAnimating(true);
    setShowElimination(false);

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawP = Math.min(elapsed / duration, 1);
      // Apply easing for primary step (slow start, accelerates)
      const p = step === 0 ? primaryEasing(rawP) : step === 2 ? countiesEasing(rawP) : rawP;
      setProgress(p);

      // For primary step, show elimination after bars are mostly grown
      if (step === 0 && p > 0.85 && !showElimination) {
        setShowElimination(true);
      }

      if (p < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        if (step === 0) setShowElimination(true);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Auto-advance to next step when current finishes (autoPlay mode)
  useEffect(() => {
    if (autoPlay && hasStarted && !isAnimating && progress >= 1 && currentStep < totalSteps - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, PAUSE_BETWEEN_STEPS);
      return () => clearTimeout(timer);
    }
    if (autoPlay && currentStep >= totalSteps - 1 && progress >= 1) {
      setAutoPlay(false);
    }
  }, [autoPlay, isAnimating, progress, currentStep, hasStarted]);

  // Start animation when step changes (only after user has started)
  useEffect(() => {
    if (hasStarted) {
      runAnimation(currentStep);
    }
    return () => stopAnimation();
  }, [currentStep, hasStarted]);

  const handleStart = () => {
    setHasStarted(true);
    setAutoPlay(false);
  };

  const handleRunAll = () => {
    setHasStarted(true);
    setAutoPlay(true);
  };

  const handleNext = () => {
    if (!hasStarted) {
      handleStart();
      return;
    }
    setAutoPlay(false);
    if (currentStep < totalSteps - 1) {
      stopAnimation();
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      stopAnimation();
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleReplayStep = () => {
    stopAnimation();
    setProgress(0);
    setShowElimination(false);
    // Small delay so state resets visually
    setTimeout(() => runAnimation(currentStep), 50);
  };

  const handleReplayAll = () => {
    stopAnimation();
    setProgress(0);
    setShowElimination(false);
    setAutoPlay(false);
    setHasStarted(false);
    setCurrentStep(0);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <PrimaryStep progress={progress} showElimination={showElimination} />;
      case 1: return <PairwiseBallotStep progress={progress} />;
      case 2: return <PrecinctsStep progress={progress} />;
      case 3: return <WinnerStep progress={progress} />;
      default: return null;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 4 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepLabels={STEP_LABELS}
      />

      <Box sx={{ height: { xs: 440, sm: 420 }, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflow: 'hidden' }}>
        {renderStep()}
      </Box>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
        {hasStarted && (
          <Button
            size="small"
            startIcon={<BackIcon />}
            onClick={handleBack}
            disabled={currentStep === 0}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
        )}

        {hasStarted && (
          <Button
            size="small"
            startIcon={<ReplayIcon />}
            onClick={currentStep === totalSteps - 1 ? handleReplayAll : handleReplayStep}
            variant="text"
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            {currentStep === totalSteps - 1 ? 'Replay All' : 'Replay'}
          </Button>
        )}

        {!hasStarted && (
          <>
            <Button
              size="small"
              endIcon={<NextIcon />}
              onClick={handleStart}
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              Start
            </Button>
            <Button
              size="small"
              endIcon={<NextIcon />}
              onClick={handleRunAll}
              variant="contained"
              sx={{ textTransform: 'none' }}
            >
              Play All
            </Button>
          </>
        )}

        {hasStarted && currentStep < totalSteps - 1 && (
          <Button
            size="small"
            endIcon={<NextIcon />}
            onClick={handleNext}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Next
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ElectionFlowDemo;
