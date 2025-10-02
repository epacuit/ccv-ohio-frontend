// components/vote/VoteInputTable.jsx
// This component handles USER INPUT for ranking candidates
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
  Tooltip,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import MarkdownRenderer from '../MarkdownRenderer';

// Inline component for truncated names with tooltip including description
const CandidateName = ({ name, description, maxWidth = 150 }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);
  
  useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [name]);
  
  // Build tooltip content with name and description (with markdown support)
  const tooltipContent = (
    <Box sx={{ p: 0.5 }}>
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 'bold', 
          mb: 0.5,
          color: '#fff'  // Explicit white text
        }}
      >
        {name}
      </Typography>
      {description && (
        <Box sx={{ 
          '& *': { color: '#fff !important' },  // Force all text white
          '& a': { 
            color: '#90caf9 !important',  // Light blue for links
            textDecoration: 'underline !important'
          },
          '& p': { margin: 0 }
        }}>
          <MarkdownRenderer 
            content={description}
            variant="caption"
            sx={{ 
              color: '#fff',
              '& p': { mb: 0 }
            }}
          />
        </Box>
      )}
    </Box>
  );
  
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
  
  // Show tooltip if overflowing OR if there's a description
  return (isOverflowing || description) ? (
    <Tooltip 
      title={tooltipContent} 
      placement="top" 
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',  // Dark background with high opacity
            color: '#fff',  // White text
            border: '1px solid rgba(255, 255, 255, 0.1)',  // Subtle border
            fontSize: '0.875rem',
            maxWidth: 400,  // Wider tooltips for descriptions
            '& .MuiTooltip-arrow': {
              color: 'rgba(0, 0, 0, 0.95)',
            }
          }
        }
      }}
    >
      {content}
    </Tooltip>
  ) : content;
};

// Inline component for ballot marks
const BallotMark = ({ checked, onChange, candidateId, rank }) => {
  return (
    <Box
      onClick={onChange}
      data-testid={`ballot-mark-${candidateId}-${rank}`}
      role="checkbox"
      aria-checked={checked}
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: '2px solid',
        borderColor: 'text.secondary',
        backgroundColor: checked ? '#1a1a1a' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: checked ? '#1a1a1a' : 'action.hover',
        },
        '&::after': checked ? {
          content: '""',
          position: 'absolute',
          top: '2px',
          left: '2px',
          right: '2px',
          bottom: '2px',
          borderRadius: '50%',
          backgroundColor: '#1a1a1a',
          opacity: 0.9,
          transform: 'scale(0.95)',
        } : {},
      }}
    />
  );
};

const VoteInputTable = ({ 
  candidates, 
  allCandidates,  // All candidates (needed for when some are hidden)
  selections, 
  onSelectionChange, 
  settings, 
  onRemoveWriteIn,
  numRanks,  // Number of ranks allowed from poll settings
  maxAllowedRanks,  // Max ranks including write-ins
  hideUnranked = false  // Whether we're hiding unranked candidates
}) => {
  // Use numRanks if provided, otherwise fall back to candidates length
  const rankColumns = numRanks || candidates.length;
  
  // Count current selections to enforce num_ranks limit
  const currentSelectionCount = Object.keys(selections).length;
  
  const handleSelection = (candidateId, rank) => {
    const newSelections = { ...selections };
    
    // Check if we're at the max allowed ranks and trying to add a new selection
    const isCurrentlySelected = selections[candidateId] !== undefined;
    if (!isCurrentlySelected && maxAllowedRanks && currentSelectionCount >= maxAllowedRanks) {
      // Don't allow new selection if at max
      return;
    }
    
    // If ties aren't allowed, clear any other candidate with this rank
    if (!settings?.allow_ties) {
      Object.keys(newSelections).forEach(id => {
        if (newSelections[id] === rank && id !== candidateId) {
          delete newSelections[id];
        }
      });
    }
    
    // Toggle selection
    if (newSelections[candidateId] === rank) {
      delete newSelections[candidateId];
    } else {
      newSelections[candidateId] = rank;
    }
    
    onSelectionChange(newSelections);
  };

  const getOrdinalSuffix = (i) => {
    if (i === 0) return 'st';
    if (i === 1) return 'nd';
    if (i === 2) return 'rd';
    return 'th';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Click to assign ranks {settings?.allow_ties ? '(ties allowed)' : '(ties not allowed)'}
        {maxAllowedRanks && currentSelectionCount >= maxAllowedRanks && numRanks < (allCandidates?.length || candidates.length) && (
          <Chip 
            label="Maximum ranks reached" 
            size="small" 
            color="warning" 
            sx={{ ml: 2 }}
          />
        )}
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', fontSize: '1.1rem' }}>
                Candidate
              </TableCell>
              {[...Array(rankColumns)].map((_, i) => (
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
            {candidates.map((candidate) => {
              const isCurrentlySelected = selections[candidate.id] !== undefined;
              const canSelectMore = !isCurrentlySelected && maxAllowedRanks && currentSelectionCount >= maxAllowedRanks;
              
              return (
                <TableRow 
                  key={candidate.id}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                    opacity: canSelectMore ? 0.5 : 1
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Box display="flex" alignItems="center" gap={1}>
                      {candidate.is_write_in && (
                        <Tooltip title="Remove write-in candidate" placement="top">
                          <IconButton
                            size="small"
                            onClick={() => onRemoveWriteIn && onRemoveWriteIn(candidate.id)}
                            sx={{ 
                              minWidth: 'auto',
                              width: 24,
                              height: 24,
                              color: 'error.main',
                              '&:hover': {
                                backgroundColor: 'error.light',
                                color: 'error.contrastText'
                              }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <CandidateName 
                        name={candidate.name} 
                        description={candidate.description}
                        maxWidth={200} 
                      />
                      {candidate.is_write_in && (
                        <Chip label="Write-in" size="small" color="info" />
                      )}
                    </Box>
                  </TableCell>
                  {[...Array(rankColumns)].map((_, i) => (
                    <TableCell key={i} align="center">
                      <Box display="flex" justifyContent="center">
                        <BallotMark
                          checked={selections[candidate.id] === i + 1}
                          onChange={() => handleSelection(candidate.id, i + 1)}
                          candidateId={candidate.id}
                          rank={i + 1}
                        />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VoteInputTable;