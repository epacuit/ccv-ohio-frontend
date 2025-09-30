// components/vote/VotingMatchups.jsx
import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as XIcon,
  PanoramaFishEye as TieIcon,
} from '@mui/icons-material';
import { 
  BALLOT_PROCESSING_RULES,
  getPairwiseComparisonFunction 
} from '../../utils/ballotProcessingRules';

// Truncated name component
const CandidateName = ({ name, maxWidth = 90 }) => {
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const textRef = React.useRef(null);
  
  React.useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [name]);
  
  const content = (
    <Typography
      ref={textRef}
      variant="body2"
      sx={{
        maxWidth: maxWidth,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {name}
    </Typography>
  );
  
  return isOverflowing ? (
    <Tooltip title={name} placement="top" arrow>{content}</Tooltip>
  ) : content;
};

// Status icon component
const StatusIcon = ({ status, isDetermined }) => {
  const iconSx = { 
    fontSize: 20, 
    opacity: isDetermined ? 1 : 0.3,
    color: isDetermined ? undefined : 'text.disabled'
  };
  
  if (status === 'win') return <CheckIcon sx={{ ...iconSx, color: isDetermined ? 'success.main' : 'text.disabled' }} />;
  if (status === 'lose') return <XIcon sx={{ ...iconSx, color: isDetermined ? 'error.main' : 'text.disabled' }} />;
  if (status === 'tie') return <TieIcon sx={{ ...iconSx, color: isDetermined ? 'warning.main' : 'text.disabled' }} />;
  return null;
};

// Individual matchup component
const OneOnOneMatchup = ({ candidate1, candidate2, comparisonResult, tableSelections, processingRule }) => {
  const isDetermined = comparisonResult !== null;
  const cand1Id = candidate1.id;
  const cand2Id = candidate2.id;
  
  // Get ranks for tooltip
  const rank1 = tableSelections[cand1Id];
  const rank2 = tableSelections[cand2Id];
  
  // Create tooltip text
  const getTooltipText = () => {
    if (!isDetermined) {
      // Check if it's undefined due to skipped ranks
      const compareFunction = getPairwiseComparisonFunction(processingRule || BALLOT_PROCESSING_RULES.ALASKA);
      const result = compareFunction(tableSelections, cand1Id, cand2Id);
      
      if (result === null) {
        return "There is a skipped rank, so this matchup is undefined";
      } else {
        return "This matchup is not yet determined";
      }
    }
    
    if (rank1 !== undefined && rank2 !== undefined) {
      if (rank1 === rank2) {
        return `${candidate1.name} and ${candidate2.name} are both ranked ${rank1}`;
      } else if (rank1 < rank2) {
        return `${candidate1.name} (ranked ${rank1}) beats ${candidate2.name} (ranked ${rank2})`;
      } else {
        return `${candidate2.name} (ranked ${rank2}) beats ${candidate1.name} (ranked ${rank1})`;
      }
    } else if (rank1 !== undefined && rank2 === undefined) {
      return `${candidate1.name} is ranked ${rank1}, ${candidate2.name} is unranked`;
    } else if (rank1 === undefined && rank2 !== undefined) {
      return `${candidate2.name} is ranked ${rank2}, ${candidate1.name} is unranked`;
    } else {
      return `Both ${candidate1.name} and ${candidate2.name} are unranked`;
    }
  };
  
  let status1, status2;
  
  if (!isDetermined) {
    // For undetermined comparisons, show as disabled
    status1 = 'tie';
    status2 = 'tie';
  } else {
    const { choice } = comparisonResult;
    
    if (choice.length === 2) {
      // Tie - both candidates are in the choice
      status1 = 'tie';
      status2 = 'tie';
    } else if (choice.includes(cand1Id)) {
      // Candidate 1 wins
      status1 = 'win';
      status2 = 'lose';
    } else {
      // Candidate 2 wins
      status1 = 'lose';
      status2 = 'win';
    }
  }
  
  // For determined comparisons, put winner on left. For undetermined, use original order
  let leftCandidate, rightCandidate, leftStatus, rightStatus;
  
  if (isDetermined && status1 === 'win') {
    leftCandidate = candidate1;
    rightCandidate = candidate2;
    leftStatus = status1;
    rightStatus = status2;
  } else if (isDetermined && status2 === 'win') {
    leftCandidate = candidate2;
    rightCandidate = candidate1;
    leftStatus = status2;
    rightStatus = status1;
  } else {
    // Tie or undetermined - maintain alphabetical order
    if (candidate1.name <= candidate2.name) {
      leftCandidate = candidate1;
      rightCandidate = candidate2;
      leftStatus = status1;
      rightStatus = status2;
    } else {
      leftCandidate = candidate2;
      rightCandidate = candidate1;
      leftStatus = status2;
      rightStatus = status1;
    }
  }
  
  return (
    <Tooltip 
      title={getTooltipText()} 
      placement="top"
      arrow
    >
      <Box
        sx={{
          p: 1,
          border: '1px solid',
          borderColor: isDetermined ? 'divider' : 'action.disabled',
          borderRadius: 1,
          opacity: isDetermined ? 1 : 0.5,
          transition: 'all 0.3s',
          overflow: 'hidden',
          backgroundColor: isDetermined ? 'transparent' : 'action.hover',
          '&:hover': {
            borderColor: 'primary.main',
            opacity: 1,
          },
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
          <Box display="flex" alignItems="center" gap={0.5} sx={{ flex: '1 1 45%' }}>
            <StatusIcon status={leftStatus} isDetermined={isDetermined} />
            <Box sx={{ 
              fontWeight: isDetermined && leftStatus === 'win' ? 'bold' : 'normal',
              color: isDetermined ? 'text.primary' : 'text.disabled'
            }}>
              <CandidateName name={leftCandidate.name} />
            </Box>
          </Box>
          <Typography 
            variant="caption" 
            color={isDetermined ? "text.secondary" : "text.disabled"} 
            sx={{ flex: '0 0 auto' }}
          >
            vs
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5} justifyContent="flex-end" sx={{ flex: '1 1 45%' }}>
            <Box sx={{ 
              fontWeight: isDetermined && rightStatus === 'win' ? 'bold' : 'normal', 
              textAlign: 'right',
              color: isDetermined ? 'text.primary' : 'text.disabled'
            }}>
              <CandidateName name={rightCandidate.name} />
            </Box>
            <StatusIcon status={rightStatus} isDetermined={isDetermined} />
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
};

const VotingMatchups = ({ 
  candidates = [], 
  tableSelections = {},
  processingRule = BALLOT_PROCESSING_RULES.ALASKA
}) => {
  // Safety check for undefined or empty candidates
  if (!candidates || candidates.length === 0) {
    return null;
  }

  // Get comparison function based on processing rule
  const compareFunction = getPairwiseComparisonFunction(processingRule);
  
  // Generate ALL matchups with their comparison results
  const generateAllMatchupsWithResults = () => {
    const matchups = [];
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const candidate1 = candidates[i];
        const candidate2 = candidates[j];
        const comparisonResult = compareFunction(tableSelections, candidate1.id, candidate2.id);
        
        matchups.push({ 
          candidate1, 
          candidate2,
          comparisonResult,
          id: `${candidate1.id}-${candidate2.id}`,
          isDetermined: comparisonResult !== null
        });
      }
    }
    return matchups;
  };

  // Sort matchups: determined first, then undetermined
  const sortAllMatchups = (matchups) => {
    return matchups.sort((a, b) => {
      // Primary sort: determined vs undetermined
      if (a.isDetermined !== b.isDetermined) {
        return a.isDetermined ? -1 : 1; // determined first
      }
      
      if (a.isDetermined && b.isDetermined) {
        // For determined matchups, sort by result type and winner
        const aChoice = a.comparisonResult.choice;
        const bChoice = b.comparisonResult.choice;
        
        // Wins before ties
        const aIsWin = aChoice.length === 1;
        const bIsWin = bChoice.length === 1;
        
        if (aIsWin !== bIsWin) {
          return aIsWin ? -1 : 1; // wins first
        }
        
        if (aIsWin && bIsWin) {
          // Both are wins - sort by winner's rank
          const aWinnerId = aChoice[0];
          const bWinnerId = bChoice[0];
          const aWinnerRank = tableSelections[aWinnerId] || Infinity;
          const bWinnerRank = tableSelections[bWinnerId] || Infinity;
          
          if (aWinnerRank !== bWinnerRank) {
            return aWinnerRank - bWinnerRank; // better rank first
          }
          
          // Same rank - sort by winner name alphabetically
          const aWinnerName = aWinnerId === a.candidate1.id ? a.candidate1.name : a.candidate2.name;
          const bWinnerName = bWinnerId === b.candidate1.id ? b.candidate1.name : b.candidate2.name;
          
          if (aWinnerName !== bWinnerName) {
            return aWinnerName.localeCompare(bWinnerName);
          }
          
          // Same winner - sort by loser name alphabetically  
          const aLoserName = aWinnerId === a.candidate1.id ? a.candidate2.name : a.candidate1.name;
          const bLoserName = bWinnerId === b.candidate1.id ? b.candidate2.name : b.candidate1.name;
          
          return aLoserName.localeCompare(bLoserName);
        }
        
        // Both are ties - sort by candidate names
        const aNames = [a.candidate1.name, a.candidate2.name].sort();
        const bNames = [b.candidate1.name, b.candidate2.name].sort();
        
        return aNames[0].localeCompare(bNames[0]) || aNames[1].localeCompare(bNames[1]);
      }
      
      // For undetermined matchups, sort by candidate names
      const aNames = [a.candidate1.name, a.candidate2.name].sort();
      const bNames = [b.candidate1.name, b.candidate2.name].sort();
      
      return aNames[0].localeCompare(bNames[0]) || aNames[1].localeCompare(bNames[1]);
    });
  };

  const allMatchups = generateAllMatchupsWithResults();
  const sortedMatchups = sortAllMatchups(allMatchups);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        One-on-One Matchups
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        {sortedMatchups.map(({ candidate1, candidate2, comparisonResult, id, isDetermined }, index) => (
          <Box
            key={id}
            sx={{
              transition: 'all 0.3s ease-in-out',
              opacity: 0,
              animation: 'fadeIn 0.3s ease-in-out forwards',
              animationDelay: `${index * 0.05}s`,
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(-10px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            <OneOnOneMatchup
              candidate1={candidate1}
              candidate2={candidate2}
              comparisonResult={comparisonResult}
              tableSelections={tableSelections}
              processingRule={processingRule}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default VotingMatchups;