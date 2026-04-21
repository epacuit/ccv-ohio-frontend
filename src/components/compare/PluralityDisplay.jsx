// Plurality display: first-place votes only. Winner is the candidate with the
// most first-place votes. No head-to-head, no transfers.
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import { EmojiEvents as TrophyIcon, People as PeopleIcon } from '@mui/icons-material';

// Placement colors (shared palette with RCV display — winner green, 2nd orange, …)
const PLACEMENT_COLORS = [
  '#2E7D32',
  '#E65100',
  '#C62828',
  '#5D4037',
  '#546E7A',
  '#827717',
  '#6A1B9A',
  '#00695C',
];

const PluralityDisplay = ({ data }) => {
  const theme = useTheme();

  // Round 1 of the IRV compute = first-place tallies (shares split across ties).
  const tallies = data.rounds[0].tallies;
  const total = Object.values(tallies).reduce((s, v) => s + v, 0);
  const sorted = Object.entries(tallies).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0][0];
  const winnerVotes = sorted[0][1];
  const winnerPct = (winnerVotes / total) * 100;
  const winnerColor = PLACEMENT_COLORS[0];

  const colorFor = (cand) => {
    const idx = sorted.findIndex(([c]) => c === cand);
    return idx >= 0 ? PLACEMENT_COLORS[idx] : '#607D8B';
  };

  return (
    <Box>
      {/* Winner hero */}
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
          textAlign: { xs: 'center', md: 'left' },
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: { xs: 'center', md: 'flex-start' },
            mb: { xs: 2, md: 0 },
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
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              Plurality Winner
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
              {winner}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Has the most first-place votes
              {' '}({Math.round(winnerVotes).toLocaleString()} ballots, {winnerPct.toFixed(1)}%)
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Bar chart */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 1, fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 600 }}
        >
          First-Place Votes
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1rem' }}>
          Each voter's first choice only. The candidate with the most first-place votes wins.
        </Typography>

        {sorted.map(([cand, votes]) => {
          const pct = (votes / total) * 100;
          return (
            <Box key={cand} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colorFor(cand), fontSize: '0.95rem' }}>
                  {cand}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                  {Math.round(votes).toLocaleString()} ({pct.toFixed(1)}%)
                </Typography>
              </Box>
              <Box sx={{ height: 16, bgcolor: 'grey.100', borderRadius: 0.5, overflow: 'hidden' }}>
                <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: colorFor(cand) }} />
              </Box>
            </Box>
          );
        })}

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {data.total_ballots.toLocaleString()} ballot{data.total_ballots !== 1 ? 's' : ''} cast
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default PluralityDisplay;
