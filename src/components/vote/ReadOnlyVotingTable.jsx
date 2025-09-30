// components/vote/ReadOnlyVotingTable.jsx
// FIXED VERSION - Properly detects and displays rank 4
import React, { useState, useEffect, useRef } from 'react';
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
  Chip,
  Tooltip
} from '@mui/material';

// Inline component for truncated names with tooltip
const CandidateName = ({ name, maxWidth = 150 }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);
  
  useEffect(() => {
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

// Read-only ballot mark component with highlight support
const ReadOnlyBallotMark = ({ checked, highlightColor = null }) => {
  const getBackgroundColor = () => {
    if (!checked) return 'transparent';
    if (highlightColor === 'green') return '#4caf50';
    if (highlightColor === 'red') return '#f44336';
    if (highlightColor === 'yellow') return '#ff9800';
    return '#1a1a1a';
  };

  const getBorderColor = () => {
    if (highlightColor === 'green') return '#4caf50';
    if (highlightColor === 'red') return '#f44336';
    if (highlightColor === 'yellow') return '#ff9800';
    return 'text.secondary';
  };

  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: '2px solid',
        borderColor: getBorderColor(),
        backgroundColor: checked ? getBackgroundColor() : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        ...(highlightColor && {
          boxShadow: `0 0 8px ${getBackgroundColor()}`,
        }),
        '&::after': checked ? {
          content: '""',
          position: 'absolute',
          top: '2px',
          left: '2px',
          right: '2px',
          bottom: '2px',
          borderRadius: '50%',
          backgroundColor: getBackgroundColor(),
          opacity: 0.9,
          transform: 'scale(0.95)',
        } : {},
      }}
    />
  );
};

const ReadOnlyVotingTable = ({ 
  candidates, 
  selections, 
  title = "Your Ballot",
  highlightCandidates = {},
  maxRank = null // Optional: explicitly set number of rank columns
}) => {
  const getOrdinalSuffix = (i) => {
    if (i === 0) return 'st';
    if (i === 1) return 'nd';
    if (i === 2) return 'rd';
    return 'th';
  };

  // Debug logging
  console.log('ReadOnlyVotingTable inputs:');
  console.log('  selections:', selections);
  console.log('  candidates:', candidates);
  console.log('  maxRank prop:', maxRank);

  // CRITICAL FIX: Calculate number of rank columns needed
  let numRankColumns = candidates.length; // Start with number of candidates
  
  // Check actual ranks in the selections data
  const ranksInUse = Object.values(selections).filter(r => typeof r === 'number');
  let highestRankInData = 0;
  
  if (ranksInUse.length > 0) {
    highestRankInData = Math.max(...ranksInUse);
    console.log('  Highest rank in current ballot data:', highestRankInData);
  }
  
  // Use the MAXIMUM of:
  // 1. Number of candidates
  // 2. Highest rank in the actual data
  // 3. Explicitly provided maxRank
  numRankColumns = Math.max(
    candidates.length,
    highestRankInData,
    maxRank || 0
  );
  
  // CRITICAL: For Alaska 2022, if we see rank 4, show 4 columns!
  if (highestRankInData === 4 && numRankColumns < 4) {
    console.warn('RANK 4 DETECTED but only showing', numRankColumns, 'columns - FIXING!');
    numRankColumns = 4;
  }
  
  console.log('  FINAL numRankColumns:', numRankColumns);

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', fontSize: '1.1rem' }}>
                Candidate
              </TableCell>
              {[...Array(numRankColumns)].map((_, i) => (
                <TableCell 
                  key={i} 
                  align="center" 
                  sx={{ 
                    fontWeight: 'bold', 
                    backgroundColor: 'primary.main', 
                    color: 'white',
                    minWidth: 60,
                    fontSize: '1.1rem'
                  }}
                >
                  {i + 1}{getOrdinalSuffix(i)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow 
                key={candidate.id}
                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
              >
                <TableCell component="th" scope="row">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CandidateName name={candidate.name} maxWidth={200} />
                    {candidate.is_write_in && (
                      <Chip label="Write-in" size="small" color="info" />
                    )}
                  </Box>
                </TableCell>
                {[...Array(numRankColumns)].map((_, i) => {
                  const rank = i + 1;
                  const isSelected = selections[candidate.id] === rank;
                  const highlightColor = highlightCandidates[candidate.id] || null;
                  
                  // Debug for rank 4
                  if (rank === 4 && isSelected) {
                    console.log('  Displaying rank 4 for', candidate.name);
                  }
                  
                  return (
                    <TableCell key={i} align="center">
                      <Box display="flex" justifyContent="center">
                        <ReadOnlyBallotMark 
                          checked={isSelected} 
                          highlightColor={isSelected ? highlightColor : null}
                        />
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReadOnlyVotingTable;