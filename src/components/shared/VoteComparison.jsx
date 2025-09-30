import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { WINNER_COLORS, WINNER_TYPE_COLORS } from '../../constants/winnerColors';

/**
 * VoteComparison Component
 * 
 * Displays a head-to-head comparison between two candidates with animated bars.
 * 
 * Extracted from WinnerExplanation to reduce complexity and improve reusability.
 * 
 * Color Logic (centralized):
 * - If not a tie: Winner of the matchup gets green, loser gets red
 * - If a tie and overall winner is involved: Overall winner gets green
 * - If a tie and overall winner not involved: First candidate arbitrarily gets green
 * 
 * @param {Object} props
 * @param {string} props.candidateA - First candidate name
 * @param {string} props.candidateB - Second candidate name
 * @param {number} props.votesA - Votes for candidate A
 * @param {number} props.votesB - Votes for candidate B
 * @param {number} props.totalVoters - Total number of voters
 * @param {string} props.overallWinner - The overall winner of the election (for tie coloring)
 * @param {boolean} props.animate - Whether to animate the bars
 * @param {Object} props.ballotSupport - Support data for expanded view
 * @param {Array} props.ballotTypes - Ballot type data for table
 * @param {string} props.resultText - Text describing the result
 * @param {boolean} props.expanded - External control of expanded state
 * @param {Function} props.onToggleExpanded - External toggle handler
 * @param {boolean} props.isTied - Whether this matchup is a tie
 * @param {ReactNode} props.children - Additional content to render
 */
const VoteComparison = ({
  candidateA,
  candidateB,
  votesA,
  votesB,
  totalVoters,
  overallWinner = null,
  animate = false,
  ballotSupport = null,
  ballotTypes = [],
  resultText = null,
  expanded: externalExpanded,
  onToggleExpanded,
  isTied = false,  // New prop to indicate if this is a tie
  children
}) => {
  const theme = useTheme();
  // Use internal state if no external control provided
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const setExpanded = onToggleExpanded || setInternalExpanded;
  
  // Determine if this is a tie (if not explicitly provided)
  const actuallyTied = isTied !== undefined ? isTied : (votesA === votesB);
  
  const [barWidths, setBarWidths] = useState({ a: 0, b: 0 });
  
  // Centralized color logic
  const getColors = () => {
    if (actuallyTied) {
      // Tie scenario
      if (overallWinner) {
        // If overall winner is involved, they get green
        if (candidateA === overallWinner) {
          return {
            colorA: WINNER_TYPE_COLORS.win,
            colorB: WINNER_TYPE_COLORS.loss
          };
        } else if (candidateB === overallWinner) {
          return {
            colorA: WINNER_TYPE_COLORS.loss,
            colorB: WINNER_TYPE_COLORS.win
          };
        }
      }
      // Neither is the overall winner, or no overall winner provided
      // Arbitrarily assign first candidate green
      return {
        colorA: WINNER_TYPE_COLORS.win,
        colorB: WINNER_TYPE_COLORS.loss
      };
    } else {
      // Not a tie - winner of matchup gets green, loser gets red
      if (votesA > votesB) {
        return {
          colorA: WINNER_TYPE_COLORS.win,
          colorB: WINNER_TYPE_COLORS.loss
        };
      } else {
        return {
          colorA: WINNER_TYPE_COLORS.loss,
          colorB: WINNER_TYPE_COLORS.win
        };
      }
    }
  };
  
  const { colorA, colorB } = getColors();
  
  // Animate bars on mount or when values change
  useEffect(() => {
    if (animate) {
      // Start at 0
      setBarWidths({ a: 0, b: 0 });
      
      // Animate to final values after delay
      const timer = setTimeout(() => {
        setBarWidths({
          a: (votesA / totalVoters) * 100,
          b: (votesB / totalVoters) * 100
        });
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      // No animation, set immediately
      setBarWidths({
        a: (votesA / totalVoters) * 100,
        b: (votesB / totalVoters) * 100
      });
    }
  }, [votesA, votesB, totalVoters, animate]);
  
  const barBackground = alpha(theme.palette.grey[300], 0.3);
  
  // Determine result text if not provided
  const getResultText = () => {
    if (resultText) return resultText;
    
    if (votesA > votesB) {
      return `${candidateA} wins by ${votesA - votesB} votes`;
    } else if (votesB > votesA) {
      return `${candidateB} wins by ${votesB - votesA} votes`;
    } else {
      return `Tied with ${votesA} votes each`;
    }
  };
  
  // Determine result color
  const getResultColor = () => {
    if (votesA > votesB) return colorA;
    if (votesB > votesA) return colorB;
    return theme.palette.grey[500]; // Tie color
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4,
        border: actuallyTied ? '2px solid' : '1px solid',
        borderColor: actuallyTied ? WINNER_COLORS.tieBorder : 'divider',  // Darker gray for ties
        borderRadius: 2,
        backgroundColor: 'background.paper',
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }
      }}
    >
      {/* Matchup header */}
      <Typography 
        variant="h6" 
        align="center" 
        gutterBottom
        sx={{ 
          fontWeight: 400,
          mb: 3,
          color: 'text.primary',
        }}
      >
        {candidateA} vs {candidateB}{actuallyTied && ' (tied)'}
      </Typography>
      
      {/* Bar charts */}
      <Box sx={{ mb: 4 }}>
        {/* Candidate A bar */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 500,
                color: colorA,
                fontSize: '0.95rem',
              }}
            >
              {candidateA}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 500,
                color: 'text.secondary',
                fontSize: '0.95rem',
              }}
            >
              {votesA} votes
            </Typography>
          </Box>
          <Box sx={{ 
            position: 'relative', 
            height: 40, 
            backgroundColor: barBackground, 
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${barWidths.a}%`,
                backgroundColor: colorA,
                transition: animate ? 'width 1.5s ease-out' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                pr: 2,
              }}
            >
              {votesA > 0 && barWidths.a > 10 && (
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  {barWidths.a.toFixed(1)}%
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        
        {/* Candidate B bar */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 500,
                color: colorB,
                fontSize: '0.95rem',
              }}
            >
              {candidateB}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 500,
                color: 'text.secondary',
                fontSize: '0.95rem',
              }}
            >
              {votesB} votes
            </Typography>
          </Box>
          <Box sx={{ 
            position: 'relative', 
            height: 40, 
            backgroundColor: barBackground, 
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${barWidths.b}%`,
                backgroundColor: colorB,
                transition: animate ? 'width 1.5s ease-out' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                pr: 2,
              }}
            >
              {votesB > 0 && barWidths.b > 10 && (
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  {barWidths.b.toFixed(1)}%
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Result text */}
      <Typography 
        variant="body1" 
        align="center" 
        sx={{ 
          mb: 3,
          color: getResultColor(),
          fontSize: '0.95rem',
          fontWeight: 500,
        }}
      >
        {getResultText()}
      </Typography>
      
      {/* Show details button - only if ballot data provided */}
      {ballotTypes.length > 0 && (
        <>
          <Box textAlign="center">
            <Button
              variant="text"
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                textTransform: 'none',
                color: getResultColor(),
                '&:hover': {
                  backgroundColor: alpha(getResultColor(), 0.08),
                }
              }}
            >
              {expanded ? 'Hide' : 'Show'} Details
            </Button>
          </Box>
          
          {/* Expandable details section */}
          <Collapse in={expanded}>
            <VotingProfileTable
              candidateA={candidateA}
              candidateB={candidateB}
              ballotTypes={ballotTypes}
              ballotSupport={ballotSupport}
              colorA={colorA}
              colorB={colorB}
            />
          </Collapse>
        </>
      )}
      
      {/* Additional content */}
      {children}
    </Paper>
  );
};

/**
 * VotingProfileTable Component
 * 
 * Shows the detailed voting profile breakdown
 */
const VotingProfileTable = ({ 
  candidateA, 
  candidateB, 
  ballotTypes, 
  ballotSupport,
  colorA,
  colorB 
}) => {
  const theme = useTheme();
  const tiedColor = theme.palette.grey[500];
  
  // Extract support arrays
  const supportA = ballotSupport?.aSupport || [];
  const supportB = ballotSupport?.bSupport || [];
  const supportTied = ballotSupport?.tiedSupport || [];
  
  return (
    <Box mt={3}>
      <Typography 
        variant="subtitle2" 
        gutterBottom 
        align="center"
        sx={{
          color: 'text.secondary',
          fontWeight: 400,
          mb: 2,
        }}
      >
        Voting Profile Analysis
      </Typography>
      
      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 500 }}>Rank</TableCell>
              {ballotTypes.map((ballotType, index) => (
                <TableCell 
                  key={index} 
                  align="center"
                  sx={{
                    backgroundColor: 
                      supportA.includes(index) 
                        ? alpha(colorA, 0.15)
                        : supportB.includes(index)
                        ? alpha(colorB, 0.15)
                        : supportTied.includes(index)
                        ? alpha(tiedColor, 0.08)
                        : 'transparent',
                    transition: 'background-color 0.3s',
                    minWidth: '80px',
                    fontWeight: 500,
                    borderBottom: supportA.includes(index) 
                      ? `2px solid ${colorA}`
                      : supportB.includes(index)
                      ? `2px solid ${colorB}`
                      : supportTied.includes(index)
                      ? `2px solid ${alpha(tiedColor, 0.5)}`
                      : 'none',
                  }}
                >
                  <strong>{ballotType.count}</strong>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {ballotType.percentage.toFixed(1)}%
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              const maxTiers = Math.max(...ballotTypes.map(bt => bt.ranking.length));
              const rows = [];
              
              for (let tierIndex = 0; tierIndex < maxTiers; tierIndex++) {
                rows.push(
                  <TableRow key={tierIndex}>
                    <TableCell sx={{ fontWeight: 500 }}>{tierIndex + 1}</TableCell>
                    {ballotTypes.map((ballotType, ballotIndex) => {
                      const tier = ballotType.ranking[tierIndex];
                      const hasA = tier && tier.includes && tier.includes(candidateA);
                      const hasB = tier && tier.includes && tier.includes(candidateB);
                      const bothInSameTier = hasA && hasB;
                      
                      return (
                        <TableCell 
                          key={ballotIndex} 
                          align="center"
                          sx={{
                            fontWeight: (hasA || hasB) ? 600 : 'normal',
                            color: bothInSameTier 
                              ? 'text.primary'
                              : hasA 
                              ? colorA 
                              : hasB 
                              ? colorB 
                              : 'text.primary',
                          }}
                        >
                          {tier && Array.isArray(tier) ? tier.join(', ') : '—'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              }
              return rows;
            })()}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box 
        mt={2} 
        p={2} 
        sx={{
          backgroundColor: alpha(theme.palette.grey[100], 0.5),
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary" align="left">
          <span style={{ color: colorA, fontWeight: 500 }}>Colored columns:</span> Voters who ranked {candidateA} above {candidateB}<br />
          <span style={{ color: colorB, fontWeight: 500 }}>Colored columns:</span> Voters who ranked {candidateB} above {candidateA}<br />
          <span style={{ color: tiedColor, fontWeight: 500 }}>Gray columns:</span> Voters who ranked them equally or didn't rank either
        </Typography>
      </Box>
    </Box>
  );
};

export default VoteComparison;