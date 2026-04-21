// Instant Runoff Voting rounds display: text description + Sankey flow diagram.
import React, { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

// Placement-based palette: 1st = winner green, 2nd = orange, 3rd+ = fading reds/browns.
// Applied in order of RCV finishing position.
const PLACEMENT_COLORS = [
  '#2E7D32',  // 1st (winner) — green
  '#E65100',  // 2nd — dark orange
  '#C62828',  // 3rd — red
  '#5D4037',  // 4th — brown
  '#546E7A',  // 5th — steel gray
  '#827717',  // 6th — olive
  '#6A1B9A',  // 7th — purple
  '#00695C',  // 8th — teal
];
const EXHAUSTED_COLOR = '#9E9E9E';

// Compute 1-indexed placement for each candidate based on IRV outcome.
// Winner = 1; runner-up (other in final round) = 2; then last-eliminated = 3, etc.
export const computePlacement = (rounds, transfers, rcvWinner) => {
  const place = { [rcvWinner]: 1 };
  const finalRemaining = rounds[rounds.length - 1].remaining;
  if (finalRemaining.length === 2) {
    const runnerUp = finalRemaining.find((c) => c !== rcvWinner);
    if (runnerUp) place[runnerUp] = 2;
  }
  let nextPlace = Object.keys(place).length + 1;
  for (let i = transfers.length - 1; i >= 0; i--) {
    const elim = transfers[i].eliminated;
    if (!(elim in place)) {
      place[elim] = nextPlace;
      nextPlace += 1;
    }
  }
  return place;
};

export const buildColorFn = (placement) => (name) => {
  if (name === '_exhausted') return EXHAUSTED_COLOR;
  const p = placement[name];
  if (!p) return '#607D8B';
  return PLACEMENT_COLORS[p - 1] || '#607D8B';
};

// ----------------------------------------------------------------
// Sankey diagram — vertical lanes per round, flows are curved paths
// ----------------------------------------------------------------
export const Sankey = ({ rounds, transfers, totalVotes, colorFor }) => {
  const theme = useTheme();
  const width = 720;
  const paddingLeft = 70;
  const paddingRight = 160;
  const laneWidth = 28;
  const height = 620;
  const paddingY = 40;
  const gapY = 10;
  const exhaustedGap = 40; // vertical space between candidate stack and exhausted band

  // One column per round. For each round, stack candidates by tally.
  // Scale: total votes counted in round 1 = full height.
  const maxVotes = rounds[0]
    ? Object.values(rounds[0].tallies).reduce((s, v) => s + v, 0)
    : totalVotes;
  // Reserve exhaustedGap worth of visual space below the candidate stack.
  const scale = (height - paddingY * 2 - exhaustedGap) / maxVotes;

  const numRounds = rounds.length;
  const innerWidth = width - paddingLeft - paddingRight - laneWidth;
  const colSpacing = innerWidth / (numRounds - 1 || 1);
  const xFor = (rIdx) => paddingLeft + rIdx * colSpacing;

  // Compute y position and height for each (round, candidate) node
  // Keep same vertical ordering across rounds so flows don't cross unnecessarily
  // Order: Peltola on top, Palin middle, Begich bottom (by first-round tally desc)
  const orderedCandidates = Object.entries(rounds[0].tallies)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);

  // Build nodes: nodes[roundIdx][candidate] = {x, y, height, votes}
  const nodes = rounds.map((round, rIdx) => {
    const x = xFor(rIdx);
    const roundNodes = {};
    let cursorY = paddingY;
    orderedCandidates.forEach((cand) => {
      const votes = round.tallies[cand];
      if (votes === undefined) return; // candidate eliminated before this round
      const h = votes * scale;
      roundNodes[cand] = { x, y: cursorY, height: h, votes, candidate: cand };
      cursorY += h + gapY;
    });
    return roundNodes;
  });

  // Exhausted ballots accumulate at the bottom per round
  // Compute cumulative exhausted at each round
  let cumExhausted = 0;
  const exhaustedNodes = rounds.map((_, rIdx) => {
    if (rIdx > 0 && transfers[rIdx - 1]) {
      cumExhausted += transfers[rIdx - 1].exhausted;
    }
    if (cumExhausted === 0) return null;
    const x = xFor(rIdx);
    const h = cumExhausted * scale;
    // Anchor to the bottom of the drawable area (candidate stack is above the gap).
    const y = height - paddingY - h;
    return { x, y, height: h, votes: cumExhausted };
  });

  // Build flows between consecutive rounds.
  // For each round transition, we need to know how each candidate's votes in round i
  // distribute to candidates (or exhausted) in round i+1.
  //   - Surviving candidates: their round-i votes flow straight across,
  //     PLUS they receive transfers[i].transfers[c].
  //   - Eliminated candidate: votes split into transfers to survivors + exhausted.
  //
  // To keep stacking consistent, we emit flows in the order of the y-stack.
  const flows = [];
  for (let rIdx = 0; rIdx < numRounds - 1; rIdx++) {
    const fromNodes = nodes[rIdx];
    const toNodes = nodes[rIdx + 1];
    const t = transfers[rIdx];
    const elim = t.eliminated;

    // Track y-offsets on source (bottom of node) and dest (top of node) sides
    const sourceOffsets = {};
    const destOffsets = {};
    Object.keys(fromNodes).forEach((c) => { sourceOffsets[c] = 0; });
    Object.keys(toNodes).forEach((c) => { destOffsets[c] = 0; });

    // 1. Surviving candidates: emit their "kept" flow first (straight across)
    //    This occupies the top of each source node and top of each dest node.
    orderedCandidates.forEach((cand) => {
      if (cand === elim) return;
      if (!fromNodes[cand] || !toNodes[cand]) return;
      const kept = fromNodes[cand].votes; // their own votes carry forward
      const h = kept * scale;
      flows.push({
        from: cand,
        to: cand,
        sourceX: fromNodes[cand].x + laneWidth,
        sourceY: fromNodes[cand].y + sourceOffsets[cand],
        destX: toNodes[cand].x,
        destY: toNodes[cand].y + destOffsets[cand],
        height: h,
        color: colorFor(cand),
        kind: 'kept',
      });
      sourceOffsets[cand] += h;
      destOffsets[cand] += h;
    });

    // 2. Eliminated candidate: transfers to survivors (in stack order)
    orderedCandidates.forEach((cand) => {
      if (cand === elim) return;
      const transferVotes = t.transfers[cand] || 0;
      if (transferVotes === 0 || !toNodes[cand]) return;
      const h = transferVotes * scale;
      flows.push({
        from: elim,
        to: cand,
        sourceX: fromNodes[elim].x + laneWidth,
        sourceY: fromNodes[elim].y + sourceOffsets[elim],
        destX: toNodes[cand].x,
        destY: toNodes[cand].y + destOffsets[cand],
        height: h,
        color: colorFor(elim),
        kind: 'transfer',
      });
      sourceOffsets[elim] += h;
      destOffsets[cand] += h;
    });

    // 3. Eliminated → exhausted
    const exhaustedAmt = t.exhausted;
    if (exhaustedAmt > 0) {
      const targetExh = exhaustedNodes[rIdx + 1];
      if (targetExh) {
        const h = exhaustedAmt * scale;
        // Destination: stack from top of exhausted node + already-placed exhausted
        // (previous rounds' exhausted stays in place; new exhausted adds on top of it)
        // Actually exhausted accumulates: new exhausted sits ABOVE prior exhausted.
        // Prior exhausted height at round rIdx:
        const priorExhAtRidx = exhaustedNodes[rIdx];
        const priorH = priorExhAtRidx ? priorExhAtRidx.height : 0;
        flows.push({
          from: elim,
          to: '_exhausted',
          sourceX: fromNodes[elim].x + laneWidth,
          sourceY: fromNodes[elim].y + sourceOffsets[elim],
          destX: targetExh.x,
          destY: targetExh.y + (targetExh.height - h - priorH) + priorH,
          height: h,
          color: colorFor('_exhausted'),
          kind: 'exhausted',
        });
      }
    }

    // Straight-through exhausted from previous rounds (stays exhausted)
    if (rIdx > 0 && exhaustedNodes[rIdx] && exhaustedNodes[rIdx + 1]) {
      const priorH = exhaustedNodes[rIdx].height;
      flows.push({
        from: '_exhausted',
        to: '_exhausted',
        sourceX: exhaustedNodes[rIdx].x + laneWidth,
        sourceY: exhaustedNodes[rIdx].y,
        destX: exhaustedNodes[rIdx + 1].x,
        destY: exhaustedNodes[rIdx + 1].y + exhaustedNodes[rIdx + 1].height - priorH,
        height: priorH,
        color: colorFor('_exhausted'),
        kind: 'exhausted-kept',
      });
    }
  }

  const curvePath = (f) => {
    const midX = (f.sourceX + f.destX) / 2;
    const y1 = f.sourceY;
    const y2 = f.destY;
    const y1b = y1 + f.height;
    const y2b = y2 + f.height;
    return [
      `M ${f.sourceX} ${y1}`,
      `C ${midX} ${y1}, ${midX} ${y2}, ${f.destX} ${y2}`,
      `L ${f.destX} ${y2b}`,
      `C ${midX} ${y2b}, ${midX} ${y1b}, ${f.sourceX} ${y1b}`,
      `Z`,
    ].join(' ');
  };

  // Hover tooltip text for each flow
  const flowTitle = (f) => {
    const n = Math.round(f.height / scale).toLocaleString();
    if (f.kind === 'kept') return `${f.from}: ${n} continuing`;
    if (f.kind === 'exhausted-kept') return `Previously exhausted: ${n}`;
    if (f.kind === 'exhausted') return `${f.from} → Exhausted: ${n}`;
    if (f.kind === 'transfer') return `${f.from} → ${f.to}: ${n}`;
    return n;
  };

  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null); // { text, x, y }

  const handleEnter = (text) => (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ text, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMove = (e) => {
    if (!tooltip) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip((t) => t && ({ ...t, x: e.clientX - rect.left, y: e.clientY - rect.top }));
  };
  const handleLeave = () => setTooltip(null);

  return (
    <Box ref={containerRef} sx={{ width: '100%', position: 'relative' }}>
     <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height + 40}`}
        width="100%"
        style={{ maxWidth: width, display: 'block', margin: '0 auto' }}
      >
        {/* Flows */}
        {flows.map((f, i) => (
          <path
            key={i}
            d={curvePath(f)}
            fill={f.color}
            fillOpacity={f.kind === 'kept' || f.kind === 'exhausted-kept' ? 0.55 : 0.35}
            stroke="none"
            style={{ cursor: 'pointer' }}
            onMouseEnter={handleEnter(flowTitle(f))}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
          />
        ))}

        {/* Candidate nodes */}
        {nodes.map((roundNodes, rIdx) =>
          Object.entries(roundNodes).map(([cand, n]) => (
            <g key={`${rIdx}-${cand}`}>
              <rect
                x={n.x}
                y={n.y}
                width={laneWidth}
                height={n.height}
                fill={colorFor(cand)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={handleEnter(`Round ${rIdx + 1} — ${cand}: ${Math.round(n.votes).toLocaleString()}`)}
                onMouseMove={handleMove}
                onMouseLeave={handleLeave}
              />
              {n.height > 16 && (
                <text
                  x={n.x + laneWidth + 8}
                  y={n.y + n.height / 2}
                  alignmentBaseline="middle"
                  fontSize="16"
                  fontWeight="600"
                  fill={theme.palette.text.primary}
                  style={{ pointerEvents: 'none' }}
                >
                  {cand} {Math.round(n.votes).toLocaleString()}
                </text>
              )}
            </g>
          ))
        )}

        {/* Exhausted nodes */}
        {exhaustedNodes.map((n, rIdx) => n && (
          <g key={`exh-${rIdx}`}>
            <rect
              x={n.x}
              y={n.y}
              width={laneWidth}
              height={n.height}
              fill={colorFor('_exhausted')}
              style={{ cursor: 'pointer' }}
              onMouseEnter={handleEnter(`Round ${rIdx + 1} — Exhausted: ${Math.round(n.votes).toLocaleString()}`)}
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
            />
            {n.height > 14 && (
              <text
                x={n.x + laneWidth + 8}
                y={n.y + n.height / 2}
                alignmentBaseline="middle"
                fontSize="15"
                fontStyle="italic"
                fill={theme.palette.text.secondary}
                style={{ pointerEvents: 'none' }}
              >
                Exhausted {Math.round(n.votes).toLocaleString()}
              </text>
            )}
          </g>
        ))}

        {/* Round labels */}
        {rounds.map((r, rIdx) => (
          <text
            key={`lab-${rIdx}`}
            x={xFor(rIdx) + laneWidth / 2}
            y={height + 24}
            textAnchor="middle"
            fontSize="15"
            fontWeight="700"
            fill={theme.palette.text.secondary}
          >
            Round {r.round}
          </text>
        ))}
      </svg>
     </Box>

      {tooltip && (() => {
        const containerWidth = containerRef.current?.getBoundingClientRect().width || 0;
        const flipLeft = tooltip.x > containerWidth * 0.6;
        return (
          <Box
            sx={{
              position: 'absolute',
              left: flipLeft ? tooltip.x - 12 : tooltip.x + 12,
              top: tooltip.y + 12,
              transform: flipLeft ? 'translateX(-100%)' : 'none',
              bgcolor: 'rgba(0,0,0,0.88)',
              color: '#fff',
              px: 1.25,
              py: 0.75,
              borderRadius: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
              boxShadow: 2,
            }}
          >
            {tooltip.text}
          </Box>
        );
      })()}
    </Box>
  );
};

// ----------------------------------------------------------------
// Round-by-round tally cards
// ----------------------------------------------------------------
const RoundCard = ({ round, transfer, isFinal, winner, colorFor }) => {
  const theme = useTheme();
  const totalThisRound = Object.values(round.tallies).reduce((s, v) => s + v, 0);
  const sorted = Object.entries(round.tallies).sort((a, b) => b[1] - a[1]);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, mb: 2, borderColor: isFinal ? 'success.main' : 'divider', borderWidth: isFinal ? 2 : 1 }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
      >
        Round {round.round}
        {isFinal && (
          <Typography component="span" variant="body1" sx={{ ml: 1, color: 'success.main', fontWeight: 600 }}>
            — {winner} wins
          </Typography>
        )}
      </Typography>

      {sorted.map(([cand, votes]) => {
        const pct = (votes / totalThisRound) * 100;
        return (
          <Box key={cand} sx={{ mb: 1.25 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colorFor(cand), fontSize: '0.95rem' }}>
                {cand}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                {Math.round(votes).toLocaleString()} ({pct.toFixed(1)}%)
              </Typography>
            </Box>
            <Box sx={{
              height: 12,
              borderRadius: 0.5,
              bgcolor: 'grey.100',
              overflow: 'hidden',
            }}>
              <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: colorFor(cand) }} />
            </Box>
          </Box>
        );
      })}

      {transfer && (
        <Box sx={{
          mt: 2,
          pt: 1.5,
          borderTop: '1px dashed',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
        }}>
          <ArrowIcon sx={{ fontSize: 22, color: 'text.secondary', mt: 0.25 }} />
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600, color: colorFor(transfer.eliminated), fontSize: '1rem' }}>
              {transfer.eliminated} eliminated
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
              Ballots redistribute to next choice:
              {' '}
              {Object.entries(transfer.transfers)
                .filter(([, v]) => v > 0)
                .map(([c, v]) => `${c} +${Math.round(v).toLocaleString()}`)
                .join(', ')}
              {transfer.exhausted > 0 && (
                <>, <em>{Math.round(transfer.exhausted).toLocaleString()} exhausted</em></>
              )}
            </Typography>
          </Box>
        </Box>
      )}

      {isFinal && (
        <Box sx={{
          mt: 2,
          pt: 1.5,
          borderTop: '1px dashed',
          borderColor: 'divider',
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {winner} is ranked first by a majority of non-exhausted ballots.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// ----------------------------------------------------------------
// Main display
// ----------------------------------------------------------------
const RCVRoundsDisplay = ({ data }) => {
  const theme = useTheme();
  const { rounds, transfers, rcv_winner, total_ballots } = data;
  const placement = computePlacement(rounds, transfers, rcv_winner);
  const colorFor = buildColorFn(placement);
  const winnerColor = PLACEMENT_COLORS[0]; // same green used for 1st place

  return (
    <Box>
      {/* Winner hero — uses unified winner green (same as Consensus display) */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: { xs: 3, sm: 4 },
          background: `linear-gradient(135deg, ${alpha(winnerColor, 0.08)} 0%, ${alpha(winnerColor, 0.03)} 100%)`,
          border: `2px solid ${winnerColor}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{
          display: { xs: 'block', md: 'flex' },
          alignItems: 'center',
          gap: 3,
          textAlign: { xs: 'center', md: 'left' }
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: { xs: 'center', md: 'flex-start' },
            mb: { xs: 2, md: 0 }
          }}>
            <TrophyIcon sx={{ fontSize: { xs: 50, sm: 60, md: 70 }, color: winnerColor }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{
                color: winnerColor,
                fontWeight: 600,
                letterSpacing: 1.5,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              Instant Runoff Winner
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 'bold',
                color: winnerColor,
                lineHeight: 1.1,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                mb: 1,
              }}
            >
              {rcv_winner}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Has a majority of remaining votes after {rounds.length - 1} elimination round{rounds.length - 1 === 1 ? '' : 's'}.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Two-column: rounds on left, Sankey on right */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 4,
      }}>
        {/* Left: rounds */}
        <Box>
          <Typography
            variant="h6"
            sx={{ mb: 1, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
          >
            Elimination Order
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '1rem' }}>
            Eliminate the lowest candidate and redistribute their ballots, until a candidate
            has a majority of first-place votes.
          </Typography>
          {rounds.map((round, i) => (
            <RoundCard
              key={round.round}
              round={round}
              transfer={transfers[i]}
              isFinal={i === rounds.length - 1}
              winner={rcv_winner}
              colorFor={colorFor}
            />
          ))}
        </Box>

        {/* Right: Sankey */}
        <Box>
          <Typography
            variant="h6"
            sx={{ mb: 1, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
          >
            Ballot Flow
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '1rem' }}>
            Each band represents a group of ballots. Ballots from eliminated candidates
            transfer to other candidates, or become <em>exhausted</em> when the voter
            didn't rank anyone still in the race. <em>Hover over any band or bar to see the exact count.</em>
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Sankey rounds={rounds} transfers={transfers} totalVotes={total_ballots} colorFor={colorFor} />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default RCVRoundsDisplay;
