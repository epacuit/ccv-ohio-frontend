import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  CompareArrows as CompareIcon,
  EmojiEvents as WinnerIcon,
  Groups as GroupsIcon,
  QuestionAnswer as QuestionIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Diversity3 as CommunityIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
//import VoteComparison from '../components/VoteComparison';

const About = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh', bgcolor: 'white' }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Main Header */}
        <Typography variant="h3" component="h1" sx={{ mb: 8, textAlign: 'center' }}>
          About Consensus Choice Voting
        </Typography>

        {/* How It Works */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ mb: 4 }}>
            How It Works
          </Typography>
          
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="flex-start">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  <VoteIcon />
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    1. Voters Rank
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                    Each voter orders candidates from their favorite to least favorite
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="flex-start">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  <CompareIcon />
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    2. Compare All Pairs
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                    Every candidate is compared against every other candidate one-on-one
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="flex-start">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  <WinnerIcon />
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    3. Find Consensus
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                    The candidate who defeats all others head-to-head is the winner
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Typography variant="body1" paragraph sx={{ fontSize: '1.125rem', lineHeight: 1.7 }}>
            <strong>The winner is the candidate who beats every other candidate in head-to-head comparisons.</strong> This represents the broadest consensus among all voters.
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.125rem', lineHeight: 1.7 }}>
            In the unlikely event that there is no candidate who beats all others, we choose the candidate with the best win-loss record. If multiple candidates tie for the best win-loss record, we choose the one whose worst loss is smallest.
          </Typography>
          
        </Box>

        {/* Traditional Voting vs Consensus Choice */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Traditional Voting vs. Consensus Choice Voting
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.125rem', lineHeight: 1.7 }}>
            Traditional voting only counts first choices, while Consensus Choice considers all preferences:
          </Typography>

          {/* Voting Profile */}
          <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Voting Profile
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Voters</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>1st Choice</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>2nd Choice</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>3rd Choice</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>34%</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Chocolate</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Vanilla</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Strawberry</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>33%</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Vanilla</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Strawberry</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Chocolate</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px' }}>33%</td>
                    <td style={{ padding: '12px' }}>Strawberry</td>
                    <td style={{ padding: '12px' }}>Vanilla</td>
                    <td style={{ padding: '12px' }}>Chocolate</td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Traditional Voting Result
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.125rem' }}>
                  Chocolate wins with the most first place votes (34%)
                </Typography>
                <Typography variant="body1" color="error.main" sx={{ fontSize: '1.125rem' }}>
                  <strong>Problem:</strong> 66% of voters rank Chocolate last!
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Consensus Choice Result
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.125rem' }}>
                  Head-to-head comparisons:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>• Vanilla beats Chocolate 66-34</Typography>
                <Typography variant="body2" sx={{ fontSize: '1rem', mb: 2 }}>• Vanilla beats Strawberry 67-33</Typography>
                <Typography variant="body1" color="success.main" sx={{ fontSize: '1.125rem' }}>
                  <strong>Winner: Vanilla</strong> - the consensus choice
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/*<Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/results/ice-cream-example')}
              endIcon={<ArrowIcon />}
            >
              Try This Example
            </Button>
          </Box>*/}
        </Box>

        {/* IRV vs Consensus Choice */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Instant Runoff Voting vs. Consensus Choice Voting
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.125rem', lineHeight: 1.7 }}>
            Instant Runoff Voting can eliminate compromise candidates too early:
          </Typography>

          {/* Voting Profile */}
          <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Voting Profile
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Voters</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>1st Choice</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>2nd Choice</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>3rd Choice</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>40%</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Vanilla</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Chocolate</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Strawberry</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>15%</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Chocolate</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Vanilla</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Strawberry</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px' }}>45%</td>
                    <td style={{ padding: '12px' }}>Strawberry</td>
                    <td style={{ padding: '12px' }}>Chocolate</td>
                    <td style={{ padding: '12px' }}>Vanilla</td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Instant Runoff Voting Result
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.125rem' }}>
                  Round 1: Chocolate eliminated (only 15% first choice)
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.125rem' }}>
                  Round 2: Vanilla wins 55-45 over Strawberry
                </Typography>
                <Typography variant="body1" color="warning.main" sx={{ fontSize: '1.125rem' }}>
                  <strong>Problem:</strong> Strawberry voters never get to express their preference for Chocolate over Vanilla
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Consensus Choice Result
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.125rem' }}>
                  Head-to-head comparisons:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>• Chocolate beats Vanilla 60-40</Typography>
                <Typography variant="body2" sx={{ fontSize: '1rem' }}>• Vanilla beats Strawberry 55-45</Typography>
                <Typography variant="body2" sx={{ fontSize: '1rem', mb: 2 }}>• Chocolate beats Strawberry 55-45</Typography>
                <Typography variant="body1" color="success.main" sx={{ fontSize: '1.125rem' }}>
                  <strong>Winner: Chocolate</strong> - the consensus choice
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/*<Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/results/center-squeeze-example')}
              endIcon={<ArrowIcon />}
            >
              Try This Example
            </Button>
          </Box>*/}
        </Box>

        {/* Use for Your Group */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Use Consensus Choice for Your Group
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Schools & Universities"
                secondary="Student elections, class representatives, academic awards, club officers"
                primaryTypographyProps={{ fontSize: '1.25rem', fontWeight: 500 }}
                secondaryTypographyProps={{ fontSize: '1.125rem' }}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <BusinessIcon color="primary" sx={{ fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Organizations"
                secondary="Board elections, project prioritization, team decisions, strategic planning"
                primaryTypographyProps={{ fontSize: '1.25rem', fontWeight: 500 }}
                secondaryTypographyProps={{ fontSize: '1.125rem' }}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CommunityIcon color="primary" sx={{ fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Communities"
                secondary="HOA decisions, community projects, event planning, group activities"
                primaryTypographyProps={{ fontSize: '1.25rem', fontWeight: 500 }}
                secondaryTypographyProps={{ fontSize: '1.125rem' }}
              />
            </ListItem>
          </List>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/create')}
            >
              Create Your First Poll
            </Button>
          </Box>
        </Box>

      </Container>
    </Box>
  );
};

export default About;