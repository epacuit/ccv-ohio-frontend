// components/vote/PairwiseVoteForm.jsx
// Pairwise comparison voting form - voters choose between candidates in head-to-head matchups
import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Radio,
  Chip,
} from '@mui/material';

/**
 * Generate all unique pairs of candidates (N choose 2)
 */
/**
 * Generate a consistent key for a pair of candidates.
 * Always sorts IDs so the key is the same regardless of order.
 */
export function matchupKey(id1, id2) {
  return id1 < id2 ? `${id1}_vs_${id2}` : `${id2}_vs_${id1}`;
}

export function generateMatchups(candidates) {
  const matchups = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      matchups.push({
        cand1: candidates[i],
        cand2: candidates[j],
        key: matchupKey(candidates[i].id, candidates[j].id),
      });
    }
  }
  return matchups;
}

/**
 * CandidateRow - a single candidate option within a matchup.
 * Entire row is tappable. Minimum 44px touch target height.
 */
const CandidateRow = ({ candidate, checked, disabled, onClick }) => {
  const hasImage = !!candidate.image_url;
  const hasDescription = !!candidate.description;

  return (
  <Box
    sx={{
      display: 'flex',
      alignItems: hasDescription ? 'flex-start' : 'center',
      cursor: disabled ? 'default' : 'pointer',
      py: 0.75,
      px: 0.5,
      minHeight: 44,
      borderRadius: 1,
      '&:hover': disabled ? {} : { backgroundColor: 'action.hover' },
      '&:active': disabled ? {} : { backgroundColor: 'action.selected' },
    }}
    onClick={onClick}
  >
    <Radio
      checked={checked}
      disabled={disabled}
      sx={{
        p: 0.5,
        mr: 1,
        flexShrink: 0,
        ...(hasDescription ? { mt: 0.25 } : {}),
        '& .MuiSvgIcon-root': { fontSize: 28 },
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    />
    {hasImage && (
      <Box
        component="img"
        src={candidate.image_url}
        alt={candidate.name}
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          objectFit: 'cover',
          mr: 1.5,
          flexShrink: 0,
        }}
      />
    )}
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {candidate.name}
      </Typography>
      {hasDescription && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.25, lineHeight: 1.3 }}
        >
          {candidate.description}
        </Typography>
      )}
    </Box>
  </Box>
  );
};

/**
 * PairwiseVoteForm Component
 *
 * Displays head-to-head matchups as a ballot with bubble circles.
 * For each matchup, voters can:
 * - Select one candidate (strict preference)
 * - Select both candidates (tie/indifference)
 * - Leave blank (no comparison)
 */
const PairwiseVoteForm = ({
  candidates = [],
  selections = {},
  onSelectionChange,
  disabled = false,
  readOnly = false,
}) => {
  const matchups = useMemo(() => generateMatchups(candidates), [candidates]);

  const handleCircleClick = (matchupKey, side) => {
    if (disabled || readOnly) return;

    const current = selections[matchupKey] || { cand1: false, cand2: false };
    const newSelections = {
      ...selections,
      [matchupKey]: {
        ...current,
        [side]: !current[side],
      },
    };
    onSelectionChange(newSelections);
  };

  if (candidates.length < 2) {
    return (
      <Typography variant="body1" color="text.secondary">
        At least 2 candidates are needed for pairwise voting.
      </Typography>
    );
  }

  return (
    <Box>
      {!readOnly && (
        <Typography
          variant="body2"
          sx={{ mb: 2, fontWeight: 600, px: { xs: 0.5, sm: 0 } }}
        >
          To vote, darken the circle next to your preferred candidate in each
          matchup. If you do not darken a circle in a head-to-head matchup, no preference will be recorded for that matchup.
        </Typography>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          maxWidth: 420,
          mx: 'auto',
        }}
      >
        {matchups.map((matchup) => {
          const sel = selections[matchup.key] || { cand1: false, cand2: false };
          const isTie = sel.cand1 && sel.cand2;
          const isBlank = !sel.cand1 && !sel.cand2;
          const highlighted = isTie || (readOnly && isBlank);

          return (
            <Paper
              key={matchup.key}
              variant="outlined"
              sx={{
                px: { xs: 1.5, sm: 2 },
                py: 1,
                borderColor: highlighted ? 'warning.light' : 'divider',
              }}
            >
              <CandidateRow
                candidate={matchup.cand1}
                checked={sel.cand1}
                disabled={disabled || readOnly}
                onClick={() => handleCircleClick(matchup.key, 'cand1')}
              />

              <CandidateRow
                candidate={matchup.cand2}
                checked={sel.cand2}
                disabled={disabled || readOnly}
                onClick={() => handleCircleClick(matchup.key, 'cand2')}
              />

              {isTie && (
                <Typography
                  variant="caption"
                  color="warning.dark"
                  sx={{ display: 'block', mt: 0.5, ml: 5, fontStyle: 'italic' }}
                >
                  Both selected: No preference recorded
                </Typography>
              )}

              {readOnly && isBlank && (
                <Typography
                  variant="caption"
                  color="warning.dark"
                  sx={{ display: 'block', mt: 0.5, ml: 5, fontStyle: 'italic' }}
                >
                  Neither selected: No preference recorded
                </Typography>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default PairwiseVoteForm;
