// Ranking ballot (click a cell to assign a rank). Supports both read-only and
// interactive modes — pass onChange to make it editable.
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

const BallotMark = ({ checked, clickable, onClick }) => (
  <Box
    onClick={clickable ? onClick : undefined}
    sx={{
      width: 24,
      height: 24,
      borderRadius: '50%',
      border: '2px solid',
      borderColor: 'text.secondary',
      backgroundColor: checked ? '#1a1a1a' : 'transparent',
      cursor: clickable ? 'pointer' : 'default',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      transition: 'all 0.15s',
      '&:hover': clickable ? {
        borderColor: 'primary.main',
        backgroundColor: checked ? '#1a1a1a' : 'action.hover',
      } : {},
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

const getOrdinalSuffix = (i) => {
  if (i === 0) return 'st';
  if (i === 1) return 'nd';
  if (i === 2) return 'rd';
  return 'th';
};

/**
 * Ranking ballot.
 * @param {string[]} candidates - candidate names in row order
 * @param {Object} ranking - map candidate -> rank number (1-based)
 * @param {number} numRanks - number of rank columns to display
 * @param {string} [title] - optional heading
 * @param {function} [onChange] - (newRanking) => void. Omit for read-only.
 * @param {boolean} [allowTies] - if true, multiple candidates may share a rank.
 */
const RankingBallotDisplay = ({ candidates, ranking = {}, onChange, numRanks, title, allowTies = false }) => {
  const cols = numRanks || candidates.length;
  const editable = typeof onChange === 'function';

  const handleClick = (cand, rank) => {
    if (!editable) return;
    const next = { ...ranking };
    if (next[cand] === rank) {
      delete next[cand];
    } else {
      if (!allowTies) {
        // Strict order: clear any other candidate at this rank
        Object.keys(next).forEach((c) => { if (next[c] === rank) delete next[c]; });
      }
      next[cand] = rank;
    }
    onChange(next);
  };

  return (
    <Box>
      {title && (
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                Candidate
              </TableCell>
              {[...Array(cols)].map((_, i) => (
                <TableCell
                  key={i}
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    minWidth: 48,
                  }}
                >
                  {i + 1}{getOrdinalSuffix(i)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {candidates.map((name) => (
              <TableRow
                key={name}
                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="body2">{name}</Typography>
                </TableCell>
                {[...Array(cols)].map((_, i) => (
                  <TableCell key={i} align="center">
                    <BallotMark
                      checked={ranking[name] === i + 1}
                      clickable={editable}
                      onClick={() => handleClick(name, i + 1)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RankingBallotDisplay;
