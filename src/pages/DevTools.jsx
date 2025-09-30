import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  LinearProgress,
  Divider,
  Chip,
  Grid,
  TextField,
  Link,
} from '@mui/material';
import {
  Science as ScienceIcon,
  AddCircle as AddIcon,
  Poll as PollIcon,
  HowToVote as VoteIcon,
  Casino as RandomIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const DevTools = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [testKey, setTestKey] = useState('test-key-12345');
  const [createdPolls, setCreatedPolls] = useState([]);

  const samplePolls = [
    {
      title: "Best Programming Language 2025",
      options: ["Python", "JavaScript/TypeScript", "Rust", "Go", "Java", "C#"],
      votePatterns: "mixed"
    },
    {
      title: "Favorite Pizza Toppings",
      options: ["Pepperoni", "Mushrooms", "Pineapple", "Vegetables", "Extra Cheese", "Meat Lovers"],
      votePatterns: "polarized"
    },
    {
      title: "Best Day for Team Meeting",
      options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      votePatterns: "consensus"
    },
    {
      title: "Project Framework Decision",
      options: ["React", "Vue", "Angular", "Svelte"],
      votePatterns: "close"
    }
  ];

  const generateRandomRankings = (optionIds, pattern = "mixed") => {
    const rankings = [];
    
    switch (pattern) {
      case "consensus":
        // Strong consensus for first option
        for (let i = 0; i < 20; i++) {
          if (Math.random() < 0.7) {
            rankings.push([
              { option_id: optionIds[0], rank: 1 },
              { option_id: optionIds[1], rank: 2 },
              { option_id: optionIds[2], rank: 3 }
            ]);
          } else {
            const shuffled = [...optionIds].sort(() => Math.random() - 0.5);
            rankings.push(shuffled.slice(0, 3).map((id, idx) => ({
              option_id: id,
              rank: idx + 1
            })));
          }
        }
        break;
        
      case "polarized":
        // Two strong camps
        for (let i = 0; i < 20; i++) {
          if (i < 10) {
            rankings.push([
              { option_id: optionIds[0], rank: 1 },
              { option_id: optionIds[1], rank: 2 }
            ]);
          } else {
            rankings.push([
              { option_id: optionIds[2], rank: 1 },
              { option_id: optionIds[3], rank: 2 }
            ]);
          }
        }
        break;
        
      case "close":
        // Very close race
        for (let i = 0; i < 30; i++) {
          const topTwo = [optionIds[0], optionIds[1]];
          if (Math.random() < 0.5) topTwo.reverse();
          rankings.push([
            { option_id: topTwo[0], rank: 1 },
            { option_id: topTwo[1], rank: 2 },
            { option_id: optionIds[2], rank: 3 }
          ]);
        }
        break;
        
      default: // mixed
        // Various patterns
        for (let i = 0; i < 25; i++) {
          const r = Math.random();
          if (r < 0.3) {
            // Complete ranking
            const shuffled = [...optionIds].sort(() => Math.random() - 0.5);
            rankings.push(shuffled.map((id, idx) => ({
              option_id: id,
              rank: idx + 1
            })));
          } else if (r < 0.5) {
            // Top 3 only
            const shuffled = [...optionIds].sort(() => Math.random() - 0.5);
            rankings.push(shuffled.slice(0, 3).map((id, idx) => ({
              option_id: id,
              rank: idx + 1
            })));
          } else if (r < 0.7) {
            // Bullet vote
            const chosen = optionIds[Math.floor(Math.random() * optionIds.length)];
            rankings.push([{ option_id: chosen, rank: 1 }]);
          } else {
            // With ties
            const first = optionIds[0];
            const second = optionIds[1];
            rankings.push([
              { option_id: first, rank: 1 },
              { option_id: second, rank: 1 },
              { option_id: optionIds[2], rank: 2 }
            ]);
          }
        }
    }
    
    return rankings;
  };

  const createPollWithVotes = async (pollConfig) => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Create poll
      const pollData = {
        title: pollConfig.title,
        description: `Test poll created with ${pollConfig.votePatterns} voting patterns`,
        options: pollConfig.options,
        is_private: false,
        voter_emails: [],
        settings: {
          allow_ties: true,
          require_complete_ranking: false,
          randomize_options: true,
          allow_write_in: false,
          show_detailed_results: true,
          show_rankings: true,
          anonymize_voters: true,
          results_visibility: "public",
          can_view_before_close: true
        },
        tags: ["test", "development", pollConfig.votePatterns]
      };
      
      const pollResponse = await API.post('/polls/', pollData);
      const poll = pollResponse.data;
      
      // Submit test ballots
      const optionIds = poll.options.map(opt => opt.id);
      const ballotPatterns = generateRandomRankings(optionIds, pollConfig.votePatterns);
      
      let successCount = 0;
      for (let i = 0; i < ballotPatterns.length; i++) {
        try {
          await API.post('/ballots/submit', {
            poll_id: poll.id,
            rankings: ballotPatterns[i],
            test_mode_key: testKey,
            browser_fingerprint: `test_${Date.now()}_${i}`
          });
          successCount++;
        } catch (err) {
          console.error('Failed to submit ballot:', err);
        }
      }
      
      setCreatedPolls([...createdPolls, { ...poll, voteCount: successCount }]);
      setMessage({
        type: 'success',
        text: `Created "${poll.title}" with ${successCount} test votes!`
      });
      
    } catch (error) {
      console.error('Error:', error);
      setMessage({
        type: 'error',
        text: `Failed: ${error.response?.data?.detail || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const createAllSamplePolls = async () => {
    for (const pollConfig of samplePolls) {
      await createPollWithVotes(pollConfig);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <ScienceIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h3" component="h1">
            Development Tools
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          This page is for development only. Use it to quickly create test polls and votes.
        </Alert>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Box mb={4}>
          <TextField
            label="Test Mode Key"
            value={testKey}
            onChange={(e) => setTestKey(e.target.value)}
            fullWidth
            margin="normal"
            helperText="This should match your backend TEST_MODE_SECRET_KEY"
            type="password"
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Quick Create Test Polls
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {samplePolls.map((poll, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => createPollWithVotes(poll)}
              >
                <Typography variant="h6" gutterBottom>
                  {poll.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {poll.options.length} options • {poll.votePatterns} pattern
                </Typography>
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  {poll.options.slice(0, 3).map((opt, i) => (
                    <Chip key={i} label={opt} size="small" />
                  ))}
                  {poll.options.length > 3 && (
                    <Chip label={`+${poll.options.length - 3} more`} size="small" variant="outlined" />
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box display="flex" gap={2} mb={4}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={createAllSamplePolls}
            disabled={loading}
          >
            Create All Sample Polls
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<RandomIcon />}
            onClick={() => {
              const randomPoll = samplePolls[Math.floor(Math.random() * samplePolls.length)];
              createPollWithVotes(randomPoll);
            }}
            disabled={loading}
          >
            Create Random Poll
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {createdPolls.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h5" gutterBottom>
              Created Polls
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {createdPolls.map((poll) => (
                <Paper key={poll.id} variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{poll.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {poll.id} • {poll.voteCount} votes
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<VoteIcon />}
                        onClick={() => navigate(`/vote/${poll.id}`)}
                      >
                        Vote
                      </Button>
                      <Button
                        size="small"
                        startIcon={<PollIcon />}
                        onClick={() => navigate(`/results/${poll.id}`)}
                        variant="contained"
                      >
                        Results
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </>
        )}

        <Divider sx={{ my: 4 }} />
        
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Remember to remove the /dev route before deploying to production!
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DevTools;