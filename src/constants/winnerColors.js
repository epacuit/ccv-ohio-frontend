/**
 * Single source of truth for winner colors across the entire application
 * These colors are used in PollResults, WinnerExplanation, and all sub-components
 * 
 * To use in any component:
 * import { WINNER_TYPE_COLORS, getWinnerColor } from '../constants/winnerColors';
 */

export const WINNER_TYPE_COLORS = {
  // Winner types
  condorcet: '#9c7c38',        // Elegant gold - Condorcet winner (beats all head-to-head)
  weakCondorcet: '#d84315',    // Red-orange - Weak Condorcet winner (ties allowed)
  copeland: '#1565c0',         // Blue - Copeland winner (best win-loss record)
  minimax: '#6a1b9a',          // Purple - Minimax winner (smallest worst loss)
  tie: '#616161',              // Gray - Tied winners
  
  // Match results
  win: '#4caf50',              // Green - Win in head-to-head
  loss: '#c62828',             // Red - Loss in head-to-head
  tied: '#616161',             // Gray - Tie in head-to-head
  
  // UI elements
  divider: '#424242',          // Dark gray for borders
  neutral: '#757575',          // Medium gray for neutral elements
};

// Backward compatibility aliases
export const WINNER_COLORS = {
  condorcetWinner: WINNER_TYPE_COLORS.condorcet,
  weakWinner: WINNER_TYPE_COLORS.weakCondorcet,
  opponent: WINNER_TYPE_COLORS.loss,
  tiedGray: WINNER_TYPE_COLORS.tied,
  copelandWinner: WINNER_TYPE_COLORS.copeland,
  minimaxWinner: WINNER_TYPE_COLORS.minimax,
  tieBorder: WINNER_TYPE_COLORS.divider,
};

// Function to get winner color based on type
export const getWinnerColor = (winnerType, isTie = false) => {
  if (isTie) return WINNER_TYPE_COLORS.tie;
  
  switch (winnerType) {
    case 'condorcet':
      return WINNER_TYPE_COLORS.condorcet;
    case 'weak_condorcet':
      return WINNER_TYPE_COLORS.weakCondorcet;
    case 'copeland':
      return WINNER_TYPE_COLORS.copeland;
    case 'minimax':
      return WINNER_TYPE_COLORS.minimax;
    case 'tie_weak_condorcet':
    case 'tie_copeland':
    case 'tie_minimax':
      return WINNER_TYPE_COLORS.tie;
    default:
      return WINNER_TYPE_COLORS.neutral;
  }
};
