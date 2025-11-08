import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  useTheme,
  alpha,
  Button,
  Alert,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
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
  'step1': 'The winner is the candidate with the most head-to-head victories. Most often, this is a candidate who beats every other candidate head-to-head.',
  'step2': 'In the unlikely event that multiple candidates are tied for the most head-to-head victories, choose the one with the smallest loss.',
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

  // Render validation messages for the demo
  const renderValidationMessage = () => {
    if (!demoValidation || Object.keys(demoSelections).length === 0) return null;
    
    // Case 1: Invalid ballot (cannot process)
    if (demoValidation.processingLevel === 'invalid') {
      return (
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          sx={{ mt: 3 }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Ballot Cannot Be Processed
          </Typography>
          {demoValidation.errors.map((error, index) => (
            <Typography key={index} variant="body2">
              {error}
            </Typography>
          ))}
        </Alert>
      );
    }
    
    // Case 2: Incomplete ballot (complete ranking required)
    if (demoValidation.processingLevel === 'incomplete') {
      return (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mt: 3 }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Complete Your Ballot
          </Typography>
          {demoValidation.errors.map((error, index) => (
            <Typography key={index} variant="body2">
              {error}
            </Typography>
          ))}
        </Alert>
      );
    }
    
    // Case 3: Truncated ballot
    if (demoValidation.processingLevel === 'truncated') {
      return (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ mt: 3 }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Ballot Will Be Truncated
          </Typography>
          {demoValidation.warnings.map((warning, index) => (
            <Typography key={index} variant="body2">
              {warning}
            </Typography>
          ))}
        </Alert>
      );
    }
    
    // Case 4: Warning (with processing notes)
    if (demoValidation.processingLevel === 'warning') {
      return (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mt: 3 }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Ballot Processing Notes
          </Typography>
          {demoValidation.warnings.map((warning, index) => (
            <Typography key={index} variant="body2" sx={{ mb: index < demoValidation.warnings.length - 1 ? 1 : 0 }}>
              {warning}
            </Typography>
          ))}
        </Alert>
      );
    }
    
    return null;
  };

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

  // Step block (clean, minimal design)
  const StepBlock = ({ id, hue, description, example }) => (
    <Box>
      <Box
        sx={{
          cursor: 'pointer',
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
        onClick={() => {
          setExpandedCases((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          );
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: hue, fontWeight: 600 }}
        >
          {expandedCases.includes(id) ? '▼' : '▶'}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: textColor, lineHeight: 1.75 }}
        >
          {description}
        </Typography>
      </Box>

      {/* Collapsible results panel */}
      {expandedCases.includes(id) && (
        <Box
          sx={{
            mt: 1,
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
            Consensus Choice makes a fair, head-to-head comparison between every pair of candidates so that broad support—not just faction size—decides the winner.
          </Typography>
        </Box>

        {/* Selection Process */}
        <Box sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 700, mb: 2, color: textColor }}
          >
            Choosing the Winner
          </Typography>

          {/* Zeroth step explanation */}
          <Typography
            variant="body1"
            sx={{ mb: 3, lineHeight: 1.75, color: textColor, fontSize: '1.05rem' }}
          >
            Voters rank candidates in order of preference. Every pair of candidates is then compared head-to-head to see who voters prefer in each matchup.
          </Typography>

          {/* Steps - no examples here */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Step 1 */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                }}
              >
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
                  }}
                >
                  1
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{ color: textColor, lineHeight: 1.75, fontSize: '1.05rem' }}
                  >
                    {STEP_TEXT['step1']}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Step 2 */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.info.main, 0.12),
                    color: theme.palette.info.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                  }}
                >
                  2
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{ color: textColor, lineHeight: 1.75, fontSize: '1.05rem' }}
                  >
                    {STEP_TEXT['step2']}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Examples Section */}
        <Box sx={{ mb: 6, maxWidth: 800, mx: 'auto' }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 700, mb: 3, color: textColor }}
          >
            Examples
          </Typography>

          {/* What Usually Happens */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 1.5, color: textColor, fontSize: '1.1rem' }}
            >
              What Usually Happens
            </Typography>
            <StepBlock
              id="condorcet-winner"
              hue={theme.palette.success.main}
              description="There is a candidate that beats every other candidate head-to-head."
              example={DEMO_EXAMPLES.find((e) => e.id === 'condorcet-winner')}
            />
          </Box>

          {/* Rare Situations */}
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 1.5, color: textColor, fontSize: '1.1rem' }}
            >
              Rare Situations
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <StepBlock
                id="most-wins"
                hue={theme.palette.info.main}
                description="There is one candidate with the most victories (but the candidate does not beat every other candidate)."
                example={DEMO_EXAMPLES.find((e) => e.id === 'most-wins')}
              />
              <StepBlock
                id="smallest-loss"
                hue={theme.palette.warning.main}
                description="There are multiple candidates with the most victories, so we choose the one with the smallest loss."
                example={DEMO_EXAMPLES.find((e) => e.id === 'smallest-loss')}
              />
            </Box>
          </Box>
        </Box>

        {/* Ballot Processing Rules */}
        <Box sx={{ mb: 6, maxWidth: 800, mx: 'auto' }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 700, mb: 2, color: textColor }}
          >
            Determining Head-to-Head Comparisons
          </Typography>

          {/* Plain text (no info box) */}
          <Box>
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
                <strong>Bob</strong>, it counts as a vote for <strong>Alice</strong> in her matchup with <strong>Bob</strong>.
              </li>
              <li>
                If the ballot assigns a rank to <strong>Alice</strong> but not to{' '}
                <strong>Bob</strong>, it counts as a vote for <strong>Alice</strong> in her matchup with <strong>Bob</strong>, as long as there is no <em>skipped rank above <strong>Alice</strong></em>.
              </li>
            </Box>
          </Box>

          {/* Interactive demo: same components as Vote page */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mt: 3,
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
                  validation={demoValidation}
                  onRemoveWriteIn={() => {}}
                  numRanks={demoCandidates.length}
                  maxAllowedRanks={demoCandidates.length}
                  hideUnranked={false}
                  disabled={false}
                />
                
                {/* Validation Message */}
                {renderValidationMessage()}
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