import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  useTheme,
  alpha,
  Button,
} from '@mui/material';
import API from '../services/api';
import ResultsDisplay from '../components/ResultsDisplay';
import DemoPairwiseBallotViewer from '../components/DemoPairwiseBallotViewer';
import VoteInputTable from '../components/vote/VoteInputTable';
import VotingMatchups from '../components/vote/VotingMatchups';
import {
  validateBallotForSubmission,
  getEffectiveBallot,
  canShowMatchups
} from '../utils/ballotValidation';
import { BALLOT_PROCESSING_RULES } from '../utils/ballotProcessingRules';

// === Example elections ===
// Step 1 is the Condorcet-winner example, remapped: D->Carol, M->Alice, R->Bob
const DEMO_EXAMPLES = [
  {
    id: 'condorcet-winner',
    name: 'Sample Election',
    candidates: ['Alice', 'Bob', 'Carol'],
    ballots: [
      // Original D:1, M:2, R:3 becomes Carol:1, Alice:2, Bob:3
      { count: 37, rankings: { Carol: 1, Alice: 2, Bob: 3 } },
      // Original D:1, M:3, R:2 becomes Carol:1, Alice: 3, Bob: 2
      { count: 3,  rankings: { Carol: 1, Alice: 3, Bob: 2 } },
      // Original D:3, M:2, R:1 becomes Carol:3, Alice:2, Bob:1
      { count: 32, rankings: { Carol: 3, Alice: 2, Bob: 1 } },
      // Original D:3, M:1, R:2 becomes Carol:3, Alice:1, Bob:2
      { count: 28, rankings: { Carol: 3, Alice: 1, Bob: 2 } },
    ],
  },
  {
    id: 'most-wins',
    name: 'Maximum Wins',
    candidates: ['Alice', 'Bob', 'Carol', 'David'],
    ballots: [
      { count: 1, rankings: { Alice: 1, Bob: 3, Carol: 4, David: 2 } },
      { count: 1, rankings: { Alice: 3, Bob: 2, Carol: 4, David: 1 } },
      { count: 1, rankings: { Alice: 3, Bob: 1, Carol: 4, David: 2 } },
      { count: 1, rankings: { Alice: 2, Bob: 1, Carol: 4, David: 3 } },
    ],
  },
  {
    id: 'smallest-loss',
    name: 'Minimum Loss',
    candidates: ['Alice', 'Bob', 'Carol', 'David'],
    ballots: [
      { count: 1, rankings: { Alice: 1, Bob: 2, Carol: 3, David: 4 } },
      { count: 1, rankings: { Alice: 2, Bob: 3, Carol: 4, David: 1 } },
      { count: 1, rankings: { Alice: 4, Bob: 1, Carol: 2, David: 3 } },
      { count: 1, rankings: { Alice: 2, Bob: 3, Carol: 1, David: 4 } },
      { count: 1, rankings: { Alice: 3, Bob: 4, Carol: 1, David: 2 } },
    ],
  },
  {
    id: 'all-tied',
    name: 'Tied Election',
    candidates: ['Alice', 'Bob', 'Carol', 'David'],
    ballots: [
      { count: 1, rankings: { Alice: 4, Bob: 2, Carol: 3, David: 1 } },
      { count: 2, rankings: { Alice: 1, Bob: 4, Carol: 3, David: 2 } },
      { count: 1, rankings: { Alice: 4, Bob: 1, Carol: 2, David: 3 } },
      { count: 1, rankings: { Alice: 2, Bob: 1, Carol: 4, David: 3 } },
    ],
  },
];

// Short text under each step header
const STEP_TEXT = {
  'condorcet-winner': 'The winner is the candidate who defeats every other candidate in head-to-head matchups.',
  'most-wins': 'If no candidate beats all the others in head-to-head matchups, choose the candidate with the most head-to-head wins.',
  'smallest-loss': 'If multiple candidates are tied for the most wins, choose the one with the smallest margin of loss.',
  'all-tied': 'If all tiebreakers are exhausted, the election results in a tie among the remaining candidates.',
};

const AboutPage = () => {
  const theme = useTheme();
  const textColor = theme.palette.mode === 'dark' ? theme.palette.text.primary : '#111';

  const [expandedCases, setExpandedCases] = useState([]);
  const [caseResults, setCaseResults] = useState({});
  const [loading, setLoading] = useState({});

  // --- Interactive ballot demo state (Alice, Bob, Carol, David) ---
  const demoCandidates = useMemo(
    () => [
      { id: 'cand_0', name: 'Alice' },
      { id: 'cand_1', name: 'Bob' },
      { id: 'cand_2', name: 'Carol' },
      { id: 'cand_3', name: 'David' },
    ],
    []
  );
  const [demoSelections, setDemoSelections] = useState({});
  const demoSettings = useMemo(
    () => ({
      allow_ties: true,
      require_complete_ranking: false,
      num_ranks: demoCandidates.length,
      ballot_processing_rule: BALLOT_PROCESSING_RULES.ALASKA, // uses skipped-rank logic as requested
      allow_write_in: false,
    }),
    [demoCandidates.length]
  );

  const demoValidation = useMemo(
    () => validateBallotForSubmission(demoSelections, demoCandidates, demoSettings),
    [demoSelections, demoCandidates, demoSettings]
  );
  const demoEffectiveBallot = useMemo(
    () => getEffectiveBallot(demoSelections, demoValidation),
    [demoSelections, demoValidation]
  );
  const demoShowMatchups = useMemo(
    () => canShowMatchups(demoSelections, demoCandidates, demoSettings.ballot_processing_rule),
    [demoSelections, demoCandidates, demoSettings]
  );

  // Calculate results for a specific example (API uses cand_* ids)
  const calculateCaseResults = async (example) => {
    if (caseResults[example.id]) return; // Already calculated
    setLoading((prev) => ({ ...prev, [example.id]: true }));
    try {
      const candidatesData = example.candidates.map((name, index) => ({ id: `cand_${index}`, name }));
      const ballotsData = example.ballots.map((ballot) => ({
        rankings: Object.entries(ballot.rankings).map(([candidateName, rank]) => {
          const candidateIndex = example.candidates.indexOf(candidateName);
          return { candidate_id: `cand_${candidateIndex}`, rank };
        }),
        count: ballot.count,
      }));
      const response = await API.post('/demo/calculate', {
        candidates: candidatesData,
        ballots: ballotsData,
      });
      setCaseResults((prev) => ({ ...prev, [example.id]: response.data }));
    } catch (err) {
      console.error('Error calculating results:', err);
    } finally {
      setLoading((prev) => ({ ...prev, [example.id]: false }));
    }
  };

  // Auto-calc when a case is expanded
  useEffect(() => {
    expandedCases.forEach((id) => {
      if (!caseResults[id]) {
        const example = DEMO_EXAMPLES.find((e) => e.id === id);
        if (example) calculateCaseResults(example);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedCases]);

  // Poll object for ResultsDisplay (ids are cand_* to match API output)
  const createMockPoll = (example) => ({
    id: example.id,
    title: example.name,
    candidates: example.candidates.map((name, index) => ({ id: `cand_${index}`, name })),
    settings: { allow_ties: true, num_ranks: example.candidates.length },
  });

  // Step block (no default background; hover-only tint)
  const StepBlock = ({ id, hue, text, example }) => (
    <Box>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          cursor: 'pointer',
          p: 2,
          borderRadius: 2,
          transition: 'background-color 0.2s, box-shadow 0.2s',
          bgcolor: 'transparent',
          '&:hover': { bgcolor: alpha(hue, 0.07) },
        }}
        onClick={() => {
          setExpandedCases((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          );
        }}
      >
        <Box
          sx={{
            minWidth: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: alpha(hue, 0.12),
            color: hue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.1rem',
          }}
        >
          {['condorcet-winner', 'most-wins', 'smallest-loss', 'all-tied'].indexOf(id) + 1}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body1"
            sx={{ color: textColor, lineHeight: 1.75, fontSize: '1.05rem' }}
          >
            {text}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 1, color: hue, fontWeight: 600, letterSpacing: 0.15 }}
          >
            Click to see example {expandedCases.includes(id) ? '▼' : '▶'}
          </Typography>
        </Box>
      </Box>

      {/* Collapsible results panel only (no extra text clutter above the results UI) */}
      {expandedCases.includes(id) && (
        <Box
          sx={{
            mt: 2,
            ml: { xs: 0, sm: 7 },
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          {caseResults[id] ? (
            <ResultsDisplay
              results={caseResults[id]}
              poll={createMockPoll(example)}
              pollId={null}
              showExportButtons={false}
              showShareButton={false}
              // IMPORTANT: the ballot viewer expects candidates with id === name,
              // so pass a separate candidates list to the viewer.
              CustomBallotViewer={DemoPairwiseBallotViewer}
              customBallotViewerProps={{
                candidates: example.candidates.map((name) => ({ id: name, name })),
                ballots: example.ballots.map((b, idx) => ({
                  id: idx + 1,
                  count: b.count,
                  rankings: b.rankings,
                })),
                results: caseResults[id],
              }}
            />
          ) : (
            <Button variant="outlined" onClick={() => calculateCaseResults(example)}>
              Show Results
            </Button>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, color: textColor, mb: 2 }}
          >
            How Consensus Choice  Works
          </Typography>
          <Typography
            variant="h6"
            sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.65, color: textColor }}
          >
            Consensus Choice makes a fair, head-to-head comparison between every pair of
            candidates so that broad support—not just faction size—decides the winner.
          </Typography>
        </Box>

        {/* Selection Process */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 700, mb: 2, color: textColor }}
          >
            The Selection Process
          </Typography>

          {/* Zeroth step explanation */}
          <Typography
            variant="body1"
            sx={{ mb: 3, lineHeight: 1.75, color: textColor, fontSize: '1.05rem' }}
          >
            Voters rank the candidates. Unless the poll designer requires it, voters do not
            need to rank every candidate. Once all ballots have been cast, candidates are
            compared in head-to-head matchups, much like a round-robin sports tournament.
          </Typography>

          {/* Steps with hover-only tint */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <StepBlock
              id="condorcet-winner"
              hue={theme.palette.success.main}
              text={STEP_TEXT['condorcet-winner']}
              example={DEMO_EXAMPLES.find((e) => e.id === 'condorcet-winner')}
            />
            <StepBlock
              id="most-wins"
              hue={theme.palette.info.main}
              text={STEP_TEXT['most-wins']}
              example={DEMO_EXAMPLES.find((e) => e.id === 'most-wins')}
            />
            <StepBlock
              id="smallest-loss"
              hue={theme.palette.warning.main}
              text={STEP_TEXT['smallest-loss']}
              example={DEMO_EXAMPLES.find((e) => e.id === 'smallest-loss')}
            />
            <StepBlock
              id="all-tied"
              hue={theme.palette.grey[700]}
              text={STEP_TEXT['all-tied']}
              example={DEMO_EXAMPLES.find((e) => e.id === 'all-tied')}
            />
          </Box>
        </Box>

        {/* Ballot Processing Rules */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 700, mb: 2, color: textColor }}
          >
            Ballot Processing Rules
          </Typography>

          {/* Plain text (no info box) */}
          <Typography variant="body1" sx={{ color: textColor, lineHeight: 1.75, mb: 2 }}>
            A <strong>ballot</strong> is a ranking of the candidates. Unless the poll designer
            requires it, voters do not need to rank every candidate.
          </Typography>
          <Typography variant="body1" sx={{ color: textColor, lineHeight: 1.75, mb: 2 }}>
            When we compare two candidates head-to-head (for example, Alice vs. Bob), we process
            a single ballot as follows:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: textColor, lineHeight: 1.75, mb: 3 }}>
            <li>
              If the ballot assigns a higher rank to <strong>Alice</strong> than to{' '}
              <strong>Bob</strong>, it counts as a win for <strong>Alice</strong>.
            </li>
            <li>
              If the ballot assigns a rank to <strong>Alice</strong> but not to{' '}
              <strong>Bob</strong>, it counts as a win for <strong>Alice</strong> as long as
              there is no <em>skipped rank above Alice</em>.
            </li>
          </Box>

          {/* Interactive demo: same components as Vote page */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: textColor }}>
              Try it: rank Alice, Bob, Carol, and David
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: textColor }}>
              Adjust the ranks below. The head-to-head results update automatically using the
              rules above.
            </Typography>

            <Box
              sx={{
                mt: 1,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
                gap: 3,
              }}
            >
              <Box>
                <VoteInputTable
                  candidates={demoCandidates}
                  allCandidates={demoCandidates}
                  selections={demoSelections}
                  onSelectionChange={setDemoSelections}
                  settings={demoSettings}
                  onRemoveWriteIn={() => {}}
                  numRanks={demoCandidates.length}
                  maxAllowedRanks={demoCandidates.length}
                  hideUnranked={false}
                  disabled={false}
                />
              </Box>

              <VotingMatchups
                candidates={demoCandidates}
                tableSelections={demoShowMatchups ? demoEffectiveBallot : {}}
                processingRule={demoSettings.ballot_processing_rule}
              />
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutPage;
