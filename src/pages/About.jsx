import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import ElectionFlowDemo from '../components/ElectionFlowDemo';
import PairwiseVoteForm from '../components/vote/PairwiseVoteForm';
import { usePageTitle } from '../hooks/usePageTitle';

const AboutPage = () => {
  usePageTitle('How It Works');
  const theme = useTheme();
  const textColor = theme.palette.mode === 'dark' ? theme.palette.text.primary : '#111';

  // Interactive demo state
  const demoCandidates = useMemo(
    () => [
      { id: 'alice', name: 'Alice' },
      { id: 'bob', name: 'Bob' },
      { id: 'carol', name: 'Carol' },
    ],
    []
  );
  const [demoSelections, setDemoSelections] = useState({});

  // Calculate demo results from selections
  const demoResults = useMemo(() => {
    const matchups = [
      { key: 'alice_vs_bob', c1: 'Alice', c2: 'Bob' },
      { key: 'alice_vs_carol', c1: 'Alice', c2: 'Carol' },
      { key: 'bob_vs_carol', c1: 'Bob', c2: 'Carol' },
    ];

    const results = [];
    matchups.forEach(m => {
      const sel = demoSelections[m.key];
      if (!sel) return;
      if (sel.cand1 && !sel.cand2) {
        results.push({ matchup: `${m.c1} vs ${m.c2}`, winner: m.c1 });
      } else if (sel.cand2 && !sel.cand1) {
        results.push({ matchup: `${m.c1} vs ${m.c2}`, winner: m.c2 });
      } else if (sel.cand1 && sel.cand2) {
        results.push({ matchup: `${m.c1} vs ${m.c2}`, winner: 'Tie' });
      }
    });

    // Check for a candidate who beats everyone
    const winsCount = { Alice: 0, Bob: 0, Carol: 0 };
    results.forEach(r => {
      if (r.winner !== 'Tie' && winsCount[r.winner] !== undefined) {
        winsCount[r.winner]++;
      }
    });

    const consensusWinner = Object.entries(winsCount).find(([, wins]) => wins === 2)?.[0] || null;
    return { results, consensusWinner, filled: results.length };
  }, [demoSelections]);

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: textColor,
              mb: 2,
              fontSize: { xs: '1.75rem', sm: '3rem' },
            }}
          >
            How Consensus Choice Works
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: 700,
              mx: 'auto',
              lineHeight: 1.65,
              color: 'text.secondary',
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            Consensus Choice finds the candidate with the broadest support by comparing
            every finalist head-to-head.
          </Typography>
        </Box>

        {/* The 3 Steps */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Step 1 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  minWidth: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  flexShrink: 0,
                }}
              >
                1
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: textColor, fontSize: '1.15rem' }}>
                  Primary Election
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.75 }}>
                  All candidates compete in a primary. The top 3 vote-getters advance to the general election.
                </Typography>
              </Box>
            </Box>

            {/* Step 2 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  minWidth: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  flexShrink: 0,
                }}
              >
                2
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: textColor, fontSize: '1.15rem' }}>
                  Head-to-Head Voting
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.75 }}>
                  In the general election, voters pick their preferred candidate in each head-to-head matchup.
                </Typography>
              </Box>
            </Box>

            {/* Step 3 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  minWidth: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.success.main, 0.12),
                  color: theme.palette.success.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  flexShrink: 0,
                }}
              >
                3
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: textColor, fontSize: '1.15rem' }}>
                  The Consensus Choice Winner
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.75 }}>
                  The candidate that wins each of their head-to-head matchups is the winner.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.75, mt: 0.5, fontStyle: 'italic' }}>
                  In the extremely rare case that every candidate loses to another candidate, the winner is the candidate with the smallest loss.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Animated Election Flow */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: textColor }}>
            See It in Action
          </Typography>
          <ElectionFlowDemo />
        </Box>

        {/* Interactive Demo */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 700, mb: 1, color: textColor }}
          >
            Try It Yourself
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            Fill in the ballot below and see how the Consensus Choice winner is determined.
          </Typography>

          {/* Ballot and results side by side, top-aligned */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3,
            alignItems: 'start',
          }}>
            {/* Ballot */}
            <PairwiseVoteForm
              candidates={demoCandidates}
              selections={demoSelections}
              onSelectionChange={setDemoSelections}
            />

            {/* Live results — always show all 3 matchups */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 420 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Your Head-to-Head Results
              </Typography>

              {[
                { key: 'alice_vs_bob', c1: 'Alice', c2: 'Bob' },
                { key: 'alice_vs_carol', c1: 'Alice', c2: 'Carol' },
                { key: 'bob_vs_carol', c1: 'Bob', c2: 'Carol' },
              ].map((m) => {
                const sel = demoSelections[m.key];
                let label, color;
                if (!sel || (!sel.cand1 && !sel.cand2)) {
                  label = 'No choice';
                  color = 'text.secondary';
                } else if (sel.cand1 && sel.cand2) {
                  label = 'No preference';
                  color = 'warning.main';
                } else if (sel.cand1) {
                  label = `${m.c1}`;
                  color = 'success.main';
                } else {
                  label = `${m.c2}`;
                  color = 'success.main';
                }

                return (
                  <Paper
                    key={m.key}
                    variant="outlined"
                    sx={{ px: 2, py: 1 }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {m.c1} vs {m.c2}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color }}>
                      {label}
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutPage;
