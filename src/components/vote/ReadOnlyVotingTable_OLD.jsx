// components/vote/ReadOnlyVotingTable.jsx
// Read-only version of VotingInputTable for success page
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
  highlightCandidates = {} // { candidateId: 'green' | 'red' | 'yellow' }
}) => {
  const getOrdinalSuffix = (i) => {
    if (i === 0) return 'st';
    if (i === 1) return 'nd';
    if (i === 2) return 'rd';
    return 'th';
  };

  // Debug: log the selections to see what we're getting
  console.log('ReadOnlyVotingTable selections:', selections);
  console.log('ReadOnlyVotingTable candidates:', candidates);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', fontSize: '1.1rem' }}>
                Candidate
              </TableCell>
              {[...Array(candidates.length)].map((_, i) => (
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
                {[...Array(candidates.length)].map((_, i) => {
                  const rank = i + 1;
                  const isSelected = selections[candidate.id] === rank;
                  const highlightColor = highlightCandidates[candidate.id] || null;
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