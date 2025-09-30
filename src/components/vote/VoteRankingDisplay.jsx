// components/vote/VoteRankingDisplay.jsx
// This component DISPLAYS the processed ballot with consecutive positions
import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

const VoteRankingDisplay = ({ selections, candidates }) => {
  
  // Process selections to create consecutive positions
  const processSelectionsToPositions = () => {
    // Group candidates by their assigned rank
    const rankedGroups = {};
    const unrankedCandidates = [];
    
    // First, separate ranked and unranked candidates
    candidates.forEach(candidate => {
      const rank = selections[candidate.id];
      if (rank !== undefined) {
        if (!rankedGroups[rank]) {
          rankedGroups[rank] = [];
        }
        rankedGroups[rank].push(candidate);
      } else {
        unrankedCandidates.push(candidate);
      }
    });
    
    // Sort the ranks and create consecutive positions
    const sortedRanks = Object.keys(rankedGroups)
      .map(r => parseInt(r))
      .sort((a, b) => a - b);
    
    const positionedGroups = [];
    let currentPosition = 1;
    
    // Assign consecutive positions to ranked candidates
    sortedRanks.forEach(rank => {
      positionedGroups.push({
        position: currentPosition,
        candidates: rankedGroups[rank]
      });
      currentPosition++;
    });
    
    // Add unranked candidates as tied for last position
    if (unrankedCandidates.length > 0) {
      positionedGroups.push({
        position: currentPosition,
        candidates: unrankedCandidates
      });
    }
    
    return positionedGroups;
  };
  
  const positionedGroups = processSelectionsToPositions();
  
  // Don't display only if there are no selections at all
  if (Object.keys(selections).length === 0) {
    return null;
  }
  
  const getPositionSuffix = (position) => {
    if (position === 1) return 'st';
    if (position === 2) return 'nd';
    if (position === 3) return 'rd';
    return 'th';
  };
  
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Processed Ballot
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your rankings converted to final ballot positions
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  width: '120px',
                  textAlign: 'center',
                  fontSize: '1rem'
                }}
              >
                Position
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Candidate(s)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positionedGroups.map((group, index) => (
              <TableRow 
                key={group.position}
                sx={{ 
                  '&:nth-of-type(odd)': { 
                    backgroundColor: 'action.hover' 
                  },
                  // Highlight the last row if it contains unranked candidates
                  ...(index === positionedGroups.length - 1 && 
                      group.candidates.some(c => selections[c.id] === undefined) && {
                    backgroundColor: 'grey.50',
                  })
                }}
              >
                <TableCell 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1.2rem',
                    color: 'primary.main',
                    textAlign: 'center'
                  }}
                >
                  {group.position}{getPositionSuffix(group.position)}
                </TableCell>
                <TableCell>
                  <Box>
                    {/* List candidates with commas */}
                    <Typography variant="body1" component="span">
                      {group.candidates.map((candidate, idx) => (
                        <React.Fragment key={candidate.id}>
                          {idx > 0 && ', '}
                          <span style={{ fontWeight: 500 }}>
                            {candidate.name}
                          </span>
                        </React.Fragment>
                      ))}
                      {/* Add (all tied) if multiple candidates at this position */}
                      {group.candidates.length > 1 && (
                        <Typography 
                          component="span"
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ ml: 1, fontStyle: 'italic' }}
                        >
                          (all tied)
                        </Typography>
                      )}
                    </Typography>
                    
                    {/* If these are unranked candidates, add a note */}
                    {group.candidates.some(c => selections[c.id] === undefined) && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}
                      >
                        Not explicitly ranked
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box 
        sx={{ 
          mt: 1, 
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {Object.keys(selections).length} of {candidates.length} candidates explicitly ranked
        </Typography>
        {Object.keys(selections).length < candidates.length && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            * Unranked candidates are considered tied for last position
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default VoteRankingDisplay;