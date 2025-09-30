import React, { useState } from 'react';

// Icons as simple SVG components
const TrophyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 2V4H2V9C2 10.1 2.9 11 4 11H6.1C6.5 13.3 8.1 15 10 15.8V19H6V21H18V19H14V15.8C15.9 15 17.5 13.3 17.9 11H20C21.1 11 22 10.1 22 9V4H17V2H7ZM4 6H6V9H4V6ZM18 9V6H20V9H18Z"/>
  </svg>
);

const VoteIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 13h-.68l-2 2h1.91L19 17H5l1.78-2h2.05l-2-2H6l-3 3v4c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2v-4l-3-3zm-1-5.05l-4.95 4.95-3.54-3.54 4.95-4.95L17 7.95zm-4.24-5.66L6.39 8.66c-.39.39-.39 1.02 0 1.41l4.95 4.95c.39.39 1.02.39 1.41 0l6.36-6.36c.39-.39.39-1.02 0-1.41L14.16 2.3c-.38-.4-1.01-.4-1.4-.01z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
  </svg>
);

const SchoolIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13H5v-2h14v2z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

const DragIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
  </svg>
);

const HandshakeIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
  </svg>
);

// Preset voting profiles
const PRESET_PROFILES = [
  {
    name: "Classic Condorcet Paradox",
    description: "Shows how majority preferences can be cyclic",
    candidates: ['Rock', 'Paper', 'Scissors'],
    ballotTypes: [
      { ranking: [['Rock'], ['Paper'], ['Scissors']], count: 23 },
      { ranking: [['Paper'], ['Scissors'], ['Rock']], count: 17 },
      { ranking: [['Scissors'], ['Rock'], ['Paper']], count: 10 },
    ]
  },
  {
    name: "Spoiler Effect",
    description: "Shows how a third candidate can change the outcome",
    candidates: ['Alice', 'Bob', 'Charlie'],
    ballotTypes: [
      { ranking: [['Alice'], ['Charlie'], ['Bob']], count: 45 },
      { ranking: [['Bob'], ['Charlie'], ['Alice']], count: 40 },
      { ranking: [['Charlie'], ['Alice'], ['Bob']], count: 15 },
    ]
  },
  {
    name: "Clear Consensus",
    description: "One candidate is preferred by most in head-to-head matchups",
    candidates: ['Alice', 'Bob', 'Charlie', 'Diana'],
    ballotTypes: [
      { ranking: [['Alice'], ['Bob'], ['Charlie']], count: 45 },
      { ranking: [['Bob'], ['Charlie'], ['Diana']], count: 30 },
      { ranking: [['Charlie'], ['Diana'], ['Alice']], count: 20 },
      { ranking: [['Diana'], ['Alice']], count: 15 },
    ]
  },
  {
    name: "Tied Preferences",
    description: "Shows how tied rankings affect different methods",
    candidates: ['Alice', 'Bob', 'Charlie'],
    ballotTypes: [
      { ranking: [['Alice', 'Bob'], ['Charlie']], count: 40 },
      { ranking: [['Charlie'], ['Bob'], ['Alice']], count: 35 },
      { ranking: [['Bob'], ['Alice', 'Charlie']], count: 25 },
    ]
  }
];

// Styles object
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  innerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 16px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  h1: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '16px'
  },
  subtitle: {
    fontSize: '20px',
    color: '#666'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    padding: '24px',
    marginBottom: '32px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  h2: {
    fontSize: '24px',
    fontWeight: '600'
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '999px',
    fontSize: '14px',
    fontWeight: '500'
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: '1px solid #d0d0d0',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    outline: 'none'
  },
  buttonHover: {
    backgroundColor: '#f5f5f5'
  },
  primaryButton: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px'
  },
  ballotEditor: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: 'white'
  },
  ballotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  input: {
    width: '80px',
    padding: '4px 8px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '14px'
  },
  rankTier: {
    marginBottom: '12px',
    padding: '12px',
    border: '2px dashed #d0d0d0',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    minHeight: '40px'
  },
  rankTierDragOver: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd'
  },
  candidateChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    backgroundColor: 'white',
    border: '1px solid #d0d0d0',
    borderRadius: '999px',
    cursor: 'move',
    fontSize: '14px',
    marginRight: '8px',
    transition: 'box-shadow 0.2s'
  },
  candidateChipHover: {
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  deleteButton: {
    padding: '4px',
    color: '#ef5350',
    cursor: 'pointer',
    background: 'none',
    border: 'none'
  },
  methodCard: {
    border: '2px solid',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center'
  },
  methodIcon: {
    margin: '0 auto 16px'
  },
  winner: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '16px 0'
  },
  progressBar: {
    height: '24px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.6s ease-out'
  },
  alert: {
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px'
  },
  warningAlert: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    color: '#856404'
  },
  successAlert: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    color: '#155724'
  },
  infoAlert: {
    backgroundColor: '#d1ecf1',
    border: '1px solid #bee5eb',
    color: '#0c5460'
  },
  tabs: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    borderBottom: '1px solid #e0e0e0'
  },
  tab: {
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#666',
    borderBottom: '2px solid transparent',
    transition: 'color 0.2s, border-color 0.2s'
  },
  tabActive: {
    color: '#1976d2',
    borderBottomColor: '#1976d2'
  },
  presetSection: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #90caf9',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '32px'
  },
  presetButton: {
    padding: '6px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #90caf9',
    backgroundColor: 'white',
    color: '#1976d2',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  presetButtonActive: {
    backgroundColor: '#1976d2',
    color: 'white'
  },
  matchupCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  matchupButton: {
    width: '100%',
    padding: '16px',
    background: 'white',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  matchupButtonHover: {
    backgroundColor: '#f5f5f5'
  },
  vsBar: {
    position: 'relative',
    height: '32px',
    backgroundColor: '#e0e0e0',
    borderRadius: '999px',
    overflow: 'hidden'
  },
  vsBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#4caf50',
    transition: 'width 0.7s ease-out'
  },
  vsBarText: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px',
    fontWeight: '600'
  },
  expandedSection: {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderTop: '1px solid #e0e0e0'
  }
};

// Consensus Choice Explanation Component
const ConsensusChoiceExplanation = ({ ballotTypes, candidates, winner }) => {
  const [expandedPairs, setExpandedPairs] = useState(new Set());
  
  const calculateHeadToHead = (candidateA, candidateB) => {
    let aVotes = 0;
    let bVotes = 0;
    
    ballotTypes.forEach(bt => {
      const { ranking, count } = bt;
      let posA = -1;
      let posB = -1;
      
      for (let i = 0; i < ranking.length; i++) {
        if (ranking[i].includes(candidateA)) posA = i;
        if (ranking[i].includes(candidateB)) posB = i;
      }
      
      if (posA !== -1 && posB !== -1) {
        if (posA < posB) aVotes += count;
        else if (posB < posA) bVotes += count;
      } else if (posA !== -1 && posB === -1) {
        aVotes += count;
      } else if (posA === -1 && posB !== -1) {
        bVotes += count;
      }
    });
    
    return { aVotes, bVotes };
  };
  
  const winnerPairs = winner ? candidates
    .filter(c => c !== winner)
    .map(opponent => {
      const { aVotes, bVotes } = calculateHeadToHead(winner, opponent);
      return { opponent, winnerVotes: aVotes, opponentVotes: bVotes };
    }) : [];
  
  const togglePair = (opponent) => {
    const newExpanded = new Set(expandedPairs);
    if (newExpanded.has(opponent)) {
      newExpanded.delete(opponent);
    } else {
      newExpanded.add(opponent);
    }
    setExpandedPairs(newExpanded);
  };
  
  return (
    <div>
      <h3 style={{ fontSize: '20px', fontWeight: '600', textAlign: 'center', marginBottom: '24px' }}>
        {winner ? `${winner} beats every other candidate head-to-head` : 'No Condorcet Winner'}
      </h3>
      
      {winner ? (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {winnerPairs.map(({ opponent, winnerVotes, opponentVotes }) => {
            const totalVotes = winnerVotes + opponentVotes;
            const winnerPercentage = totalVotes > 0 ? (winnerVotes / totalVotes) * 100 : 0;
            const isExpanded = expandedPairs.has(opponent);
            
            return (
              <div key={opponent} style={styles.matchupCard}>
                <button
                  onClick={() => togglePair(opponent)}
                  style={styles.matchupButton}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '500', color: '#4caf50' }}>{winner}</span>
                    <span style={{ fontSize: '14px', color: '#666' }}>vs</span>
                    <span style={{ fontWeight: '500', color: '#f44336' }}>{opponent}</span>
                  </div>
                  
                  <div style={styles.vsBar}>
                    <div style={{ ...styles.vsBarFill, width: `${winnerPercentage}%` }} />
                    <span style={{ ...styles.vsBarText, left: '16px', color: 'white' }}>{winnerVotes}</span>
                    <span style={{ ...styles.vsBarText, right: '16px', color: '#333' }}>{opponentVotes}</span>
                  </div>
                  
                  <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '8px' }}>
                    {winner} wins by {winnerVotes - opponentVotes} votes
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                    {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </div>
                </button>
                
                {isExpanded && (
                  <div style={styles.expandedSection}>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Ballot breakdown:</p>
                    {ballotTypes.map((bt, idx) => {
                      const { ranking } = bt;
                      let posWinner = -1;
                      let posOpponent = -1;
                      
                      for (let i = 0; i < ranking.length; i++) {
                        if (ranking[i].includes(winner)) posWinner = i;
                        if (ranking[i].includes(opponent)) posOpponent = i;
                      }
                      
                      let preference = 'Not ranked';
                      let prefColor = '#999';
                      if (posWinner !== -1 && posOpponent !== -1) {
                        if (posWinner < posOpponent) {
                          preference = `Prefers ${winner}`;
                          prefColor = '#4caf50';
                        } else if (posOpponent < posWinner) {
                          preference = `Prefers ${opponent}`;
                          prefColor = '#f44336';
                        } else {
                          preference = 'Tied';
                          prefColor = '#ff9800';
                        }
                      } else if (posWinner !== -1) {
                        preference = `Only ranked ${winner}`;
                        prefColor = '#4caf50';
                      } else if (posOpponent !== -1) {
                        preference = `Only ranked ${opponent}`;
                        prefColor = '#f44336';
                      }
                      
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                          <span>{bt.count} voters: {ranking.map(tier => tier.join('=')).join(' > ')}</span>
                          <span style={{ color: prefColor }}>{preference}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            No candidate beats all others in head-to-head matchups. The winner would be determined by a tiebreaker method.
          </p>
        </div>
      )}
      
      <p style={{ textAlign: 'center', color: '#666', marginTop: '24px', fontSize: '14px' }}>
        Consensus Choice voting selects the Condorcet winner when one exists - 
        the candidate who would win every head-to-head election.
      </p>
    </div>
  );
};

// Plurality Explanation Component
const PluralityExplanation = ({ ballotTypes, candidates, winner }) => {
  const firstPlaceVotes = {};
  candidates.forEach(c => firstPlaceVotes[c] = 0);
  
  ballotTypes.forEach(bt => {
    if (bt.ranking.length > 0 && bt.ranking[0].length > 0) {
      bt.ranking[0].forEach(candidate => {
        firstPlaceVotes[candidate] = (firstPlaceVotes[candidate] || 0) + bt.count;
      });
    }
  });
  
  const totalVotes = ballotTypes.reduce((sum, bt) => sum + bt.count, 0);
  const sortedCandidates = Object.entries(firstPlaceVotes)
    .sort(([,a], [,b]) => b - a);
  
  return (
    <div>
      <h3 style={{ fontSize: '20px', fontWeight: '600', textAlign: 'center', marginBottom: '24px' }}>
        First-Place Votes Only
      </h3>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {sortedCandidates.map(([candidate, votes]) => {
          const isWinner = candidate === winner;
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          
          return (
            <div key={candidate} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: isWinner ? '600' : '400', color: isWinner ? '#4caf50' : '#333' }}>
                  {candidate}
                </span>
                <span style={{
                  fontSize: '14px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: isWinner ? '#e8f5e9' : '#f5f5f5',
                  color: isWinner ? '#2e7d32' : '#666',
                  fontWeight: isWinner ? '500' : '400'
                }}>
                  {votes} votes ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${percentage}%`,
                    backgroundColor: isWinner ? '#4caf50' : '#9e9e9e'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', color: '#666', marginTop: '24px' }}>
        In plurality voting, only first-place votes count. The candidate with the most first-place votes wins.
      </p>
    </div>
  );
};

// IRV Explanation Component
const IRVExplanation = ({ ballotTypes, candidates, winner }) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [showAllRounds, setShowAllRounds] = useState(false);
  
  const calculateIRVRounds = () => {
    const rounds = [];
    let remainingCandidates = [...candidates];
    
    while (remainingCandidates.length > 1) {
      const roundVotes = {};
      remainingCandidates.forEach(c => roundVotes[c] = 0);
      
      ballotTypes.forEach(bt => {
        for (const tier of bt.ranking) {
          const validCandidates = tier.filter(c => remainingCandidates.includes(c));
          if (validCandidates.length > 0) {
            validCandidates.forEach(c => {
              roundVotes[c] += bt.count / validCandidates.length;
            });
            break;
          }
        }
      });
      
      const totalVotes = Object.values(roundVotes).reduce((a, b) => a + b, 0);
      const sortedCandidates = Object.entries(roundVotes).sort(([,a], [,b]) => b - a);
      
      const leader = sortedCandidates[0];
      const hasWinner = totalVotes > 0 && leader[1] > totalVotes / 2;
      
      rounds.push({
        candidates: remainingCandidates,
        votes: roundVotes,
        eliminated: hasWinner ? null : sortedCandidates[sortedCandidates.length - 1][0],
        winner: hasWinner ? leader[0] : null,
        totalVotes
      });
      
      if (hasWinner) break;
      
      const eliminated = sortedCandidates[sortedCandidates.length - 1][0];
      remainingCandidates = remainingCandidates.filter(c => c !== eliminated);
    }
    
    return rounds;
  };
  
  const rounds = calculateIRVRounds();
  
  return (
    <div>
      <h3 style={{ fontSize: '20px', fontWeight: '600', textAlign: 'center', marginBottom: '24px' }}>
        Instant Runoff Voting Rounds
      </h3>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <button
          onClick={() => setShowAllRounds(!showAllRounds)}
          style={styles.button}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          <SchoolIcon />
          {showAllRounds ? 'Show Current Round' : 'Show All Rounds'}
        </button>
      </div>
      
      {showAllRounds ? (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {rounds.map((round, index) => (
            <div key={index} style={{ ...styles.card, padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                Round {index + 1}
              </h4>
              
              {Object.entries(round.votes)
                .sort(([,a], [,b]) => b - a)
                .map(([candidate, votes]) => {
                  const percentage = round.totalVotes > 0 ? (votes / round.totalVotes) * 100 : 0;
                  const isEliminated = candidate === round.eliminated;
                  const isWinner = candidate === round.winner;
                  
                  return (
                    <div key={candidate} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '14px',
                          textDecoration: isEliminated ? 'line-through' : 'none',
                          color: isWinner ? '#2e7d32' : isEliminated ? '#999' : '#333',
                          fontWeight: isWinner ? '600' : '400'
                        }}>
                          {candidate}
                        </span>
                        <span style={{ fontSize: '12px', color: isEliminated ? '#999' : '#666' }}>
                          {votes.toFixed(1)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            backgroundColor: isWinner ? '#4caf50' : isEliminated ? '#bdbdbd' : '#2196f3',
                            transition: 'width 0.3s ease-out'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              
              {round.winner && (
                <div style={styles.successAlert}>
                  {round.winner} wins with a majority!
                </div>
              )}
              {round.eliminated && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  {round.eliminated} eliminated (fewest votes)
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <button 
              onClick={() => setCurrentRound(Math.max(0, currentRound - 1))}
              disabled={currentRound === 0}
              style={{
                ...styles.button,
                padding: '8px',
                opacity: currentRound === 0 ? 0.5 : 1,
                cursor: currentRound === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <MinusIcon />
            </button>
            <h4 style={{ fontSize: '18px', fontWeight: '600' }}>
              Round {currentRound + 1} of {rounds.length}
            </h4>
            <button 
              onClick={() => setCurrentRound(Math.min(rounds.length - 1, currentRound + 1))}
              disabled={currentRound === rounds.length - 1}
              style={{
                ...styles.button,
                padding: '8px',
                opacity: currentRound === rounds.length - 1 ? 0.5 : 1,
                cursor: currentRound === rounds.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <PlusIcon />
            </button>
          </div>
          
          {rounds[currentRound] && (
            <div style={{ ...styles.card, padding: '16px' }}>
              {Object.entries(rounds[currentRound].votes)
                .sort(([,a], [,b]) => b - a)
                .map(([candidate, votes]) => {
                  const percentage = rounds[currentRound].totalVotes > 0 ? (votes / rounds[currentRound].totalVotes) * 100 : 0;
                  const isEliminated = candidate === rounds[currentRound].eliminated;
                  const isWinner = candidate === rounds[currentRound].winner;
                  
                  return (
                    <div key={candidate} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '16px',
                          textDecoration: isEliminated ? 'line-through' : 'none',
                          color: isWinner ? '#2e7d32' : isEliminated ? '#999' : '#333',
                          fontWeight: isWinner ? '600' : '400'
                        }}>
                          {candidate}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          backgroundColor: isWinner ? '#e8f5e9' : isEliminated ? '#f5f5f5' : '#e3f2fd',
                          color: isWinner ? '#2e7d32' : isEliminated ? '#999' : '#1565c0',
                          fontWeight: isWinner ? '500' : '400'
                        }}>
                          {votes.toFixed(1)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ height: '20px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            backgroundColor: isWinner ? '#4caf50' : isEliminated ? '#9e9e9e' : '#2196f3',
                            transition: 'width 0.6s ease-out'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              
              {rounds[currentRound].winner && (
                <div style={{ ...styles.successAlert, marginTop: '16px' }}>
                  <strong>{rounds[currentRound].winner}</strong> wins with a majority!
                </div>
              )}
              {rounds[currentRound].eliminated && (
                <div style={{ ...styles.infoAlert, marginTop: '16px' }}>
                  <strong>{rounds[currentRound].eliminated}</strong> eliminated (fewest votes)
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <p style={{ textAlign: 'center', color: '#666', marginTop: '24px' }}>
        In IRV, the candidate with the fewest votes is eliminated each round. 
        Votes transfer to the next preference until someone has a majority.
      </p>
    </div>
  );
};

// Ballot Editor Component
const BallotEditor = ({ ballotType, index, onUpdate, onDelete, candidates }) => {
  const [draggedCandidate, setDraggedCandidate] = useState(null);
  const [draggedFromTier, setDraggedFromTier] = useState(null);
  const [dragOverTier, setDragOverTier] = useState(null);
  
  const handleDragStart = (e, candidate, tierIndex) => {
    setDraggedCandidate(candidate);
    setDraggedFromTier(tierIndex);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e, tierIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTier(tierIndex);
  };
  
  const handleDragLeave = () => {
    setDragOverTier(null);
  };
  
  const handleDrop = (e, targetTierIndex) => {
    e.preventDefault();
    setDragOverTier(null);
    
    if (draggedCandidate && draggedFromTier !== null) {
      const newRanking = [...ballotType.ranking];
      
      if (draggedFromTier === 'unranked') {
        if (!newRanking[targetTierIndex]) {
          newRanking[targetTierIndex] = [];
        }
        newRanking[targetTierIndex].push(draggedCandidate);
      } else {
        newRanking[draggedFromTier] = newRanking[draggedFromTier].filter(c => c !== draggedCandidate);
        if (!newRanking[targetTierIndex]) {
          newRanking[targetTierIndex] = [];
        }
        newRanking[targetTierIndex].push(draggedCandidate);
      }
      
      const cleanedRanking = newRanking.filter(tier => tier && tier.length > 0);
      
      onUpdate(index, { ...ballotType, ranking: cleanedRanking });
    }
    
    setDraggedCandidate(null);
    setDraggedFromTier(null);
  };
  
  const handleCountChange = (newCount) => {
    onUpdate(index, { ...ballotType, count: Math.max(1, parseInt(newCount) || 1) });
  };
  
  const addNewTier = () => {
    const newRanking = [...ballotType.ranking, []];
    onUpdate(index, { ...ballotType, ranking: newRanking });
  };
  
  const removeCandidate = (candidate, tierIndex) => {
    const newRanking = [...ballotType.ranking];
    newRanking[tierIndex] = newRanking[tierIndex].filter(c => c !== candidate);
    onUpdate(index, { 
      ...ballotType, 
      ranking: newRanking.filter(tier => tier.length > 0) 
    });
  };
  
  const getUnrankedCandidates = () => {
    const ranked = new Set(ballotType.ranking.flat());
    return candidates.filter(c => !ranked.has(c));
  };
  
  return (
    <div style={styles.ballotEditor}>
      <div style={styles.ballotHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#666', fontSize: '14px' }}>×</span>
          <input
            type="number"
            value={ballotType.count}
            onChange={(e) => handleCountChange(e.target.value)}
            style={styles.input}
          />
          <span style={{ color: '#666', fontSize: '14px' }}>
            voter{ballotType.count > 1 ? 's' : ''} with this ranking
          </span>
        </div>
        <button
          onClick={() => onDelete(index)}
          style={styles.deleteButton}
        >
          <TrashIcon />
        </button>
      </div>
      
      {ballotType.ranking.map((tier, tierIndex) => (
        <div 
          key={tierIndex}
          style={{
            ...styles.rankTier,
            ...(dragOverTier === tierIndex ? styles.rankTierDragOver : {})
          }}
          onDragOver={(e) => handleDragOver(e, tierIndex)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, tierIndex)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#666', minWidth: '60px' }}>
              Rank {tierIndex + 1}:
            </span>
            {tier.map((candidate) => (
              <div
                key={candidate}
                draggable
                onDragStart={(e) => handleDragStart(e, candidate, tierIndex)}
                style={styles.candidateChip}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <DragIcon />
                <span>{candidate}</span>
                <button
                  onClick={() => removeCandidate(candidate, tierIndex)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
                >
                  ×
                </button>
              </div>
            ))}
            {tier.length === 0 && (
              <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                Drop candidates here
              </span>
            )}
          </div>
        </div>
      ))}
      
      {getUnrankedCandidates().length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Unranked candidates (drag to rank):
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {getUnrankedCandidates().map((candidate) => (
              <div
                key={candidate}
                draggable
                onDragStart={(e) => handleDragStart(e, candidate, 'unranked')}
                style={{ ...styles.candidateChip, borderStyle: 'dashed' }}
              >
                <DragIcon />
                <span>{candidate}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={addNewTier}
        style={{ ...styles.button, marginTop: '16px', fontSize: '14px' }}
      >
        <PlusIcon />
        Add New Rank
      </button>
    </div>
  );
};

// Main Demo Component
const VotingMethodsDemo = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showExplanations, setShowExplanations] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(null);
  
  const [candidates, setCandidates] = useState(['Alice', 'Bob', 'Charlie', 'Diana']);
  const [ballotTypes, setBallotTypes] = useState([
    { ranking: [['Alice'], ['Bob'], ['Charlie']], count: 45 },
    { ranking: [['Bob'], ['Charlie'], ['Diana']], count: 30 },
    { ranking: [['Charlie'], ['Diana'], ['Alice']], count: 20 },
    { ranking: [['Diana'], ['Alice']], count: 15 },
  ]);
  
  const loadPreset = (preset) => {
    setCandidates(preset.candidates);
    setBallotTypes(preset.ballotTypes);
    setSelectedPreset(preset.name);
  };
  
  const totalVoters = ballotTypes.reduce((sum, bt) => sum + bt.count, 0);
  
  const updateBallotType = (index, updatedBallot) => {
    const newBallotTypes = [...ballotTypes];
    newBallotTypes[index] = updatedBallot;
    setBallotTypes(newBallotTypes);
  };
  
  const deleteBallotType = (index) => {
    setBallotTypes(ballotTypes.filter((_, i) => i !== index));
  };
  
  const addBallotType = () => {
    setBallotTypes([...ballotTypes, { ranking: [[]], count: 10 }]);
  };
  
  const calculatePluralityWinner = () => {
    const firstPlaceVotes = {};
    candidates.forEach(c => firstPlaceVotes[c] = 0);
    
    ballotTypes.forEach(bt => {
      if (bt.ranking.length > 0 && bt.ranking[0].length > 0) {
        bt.ranking[0].forEach(candidate => {
          firstPlaceVotes[candidate] = (firstPlaceVotes[candidate] || 0) + bt.count;
        });
      }
    });
    
    let maxVotes = 0;
    let winner = null;
    Object.entries(firstPlaceVotes).forEach(([candidate, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = candidate;
      }
    });
    
    return winner;
  };
  
  const calculateIRVWinner = () => {
    let remainingCandidates = [...candidates];
    
    while (remainingCandidates.length > 1) {
      const roundVotes = {};
      remainingCandidates.forEach(c => roundVotes[c] = 0);
      
      ballotTypes.forEach(bt => {
        for (const tier of bt.ranking) {
          const validCandidates = tier.filter(c => remainingCandidates.includes(c));
          if (validCandidates.length > 0) {
            validCandidates.forEach(c => {
              roundVotes[c] += bt.count / validCandidates.length;
            });
            break;
          }
        }
      });
      
      const totalVotes = Object.values(roundVotes).reduce((a, b) => a + b, 0);
      const sortedCandidates = Object.entries(roundVotes).sort(([,a], [,b]) => b - a);
      
      if (sortedCandidates.length > 0 && totalVotes > 0 && sortedCandidates[0][1] > totalVotes / 2) {
        return sortedCandidates[0][0];
      }
      
      if (sortedCandidates.length === 0) break;
      
      const lastPlace = sortedCandidates[sortedCandidates.length - 1][0];
      remainingCandidates = remainingCandidates.filter(c => c !== lastPlace);
    }
    
    return remainingCandidates[0];
  };
  
  const calculateConsensusWinner = () => {
    for (const candidateA of candidates) {
      let winsAgainstAll = true;
      
      for (const candidateB of candidates) {
        if (candidateA === candidateB) continue;
        
        let aVotes = 0;
        let bVotes = 0;
        
        ballotTypes.forEach(bt => {
          const { ranking, count } = bt;
          let posA = -1;
          let posB = -1;
          
          for (let i = 0; i < ranking.length; i++) {
            if (ranking[i].includes(candidateA)) posA = i;
            if (ranking[i].includes(candidateB)) posB = i;
          }
          
          if (posA !== -1 && posB !== -1) {
            if (posA < posB) aVotes += count;
            else if (posB < posA) bVotes += count;
          } else if (posA !== -1 && posB === -1) {
            aVotes += count;
          } else if (posA === -1 && posB !== -1) {
            bVotes += count;
          }
        });
        
        if (aVotes <= bVotes) {
          winsAgainstAll = false;
          break;
        }
      }
      
      if (winsAgainstAll) return candidateA;
    }
    
    return null;
  };
  
  const pluralityWinner = calculatePluralityWinner();
  const irvWinner = calculateIRVWinner();
  const consensusWinner = calculateConsensusWinner();
  
  const methods = [
    {
      name: 'Consensus Choice',
      winner: consensusWinner,
      color: '#4caf50',
      borderColor: '#81c784',
      bgColor: '#e8f5e9',
      icon: <HandshakeIcon />,
      description: 'Finds the candidate who would win against every other candidate in head-to-head matchups',
    },
    {
      name: 'Plurality (FPTP)',
      winner: pluralityWinner,
      color: '#2196f3',
      borderColor: '#64b5f6',
      bgColor: '#e3f2fd',
      icon: <VoteIcon />,
      description: 'The candidate with the most first-place votes wins',
    },
    {
      name: 'Instant Runoff (IRV)',
      winner: irvWinner,
      color: '#ff9800',
      borderColor: '#ffb74d',
      bgColor: '#fff3e0',
      icon: <RefreshIcon />,
      description: 'Eliminates the candidate with fewest votes each round until someone has a majority',
    },
  ];
  
  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        <div style={styles.header}>
          <h1 style={styles.h1}>Voting Methods Comparison</h1>
          <p style={styles.subtitle}>
            See how different voting methods can produce different winners from the same votes
          </p>
        </div>
        
        <div style={styles.presetSection}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0d47a1', marginBottom: '4px' }}>
                Try Example Scenarios
              </h3>
              <p style={{ fontSize: '14px', color: '#1565c0' }}>
                Load preset voting profiles to see interesting voting phenomena
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PRESET_PROFILES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset)}
                  style={{
                    ...styles.presetButton,
                    ...(selectedPreset === preset.name ? styles.presetButtonActive : {})
                  }}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.h2}>Voting Profile Editor</h2>
            <div style={styles.chip}>
              <UsersIcon />
              <span style={{ fontWeight: '500' }}>{totalVoters} total voters</span>
            </div>
          </div>
          
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Drag and drop candidates to create rankings. You can have tied ranks and partial ballots.
          </p>
          
          <div style={styles.grid}>
            {ballotTypes.map((ballotType, index) => (
              <BallotEditor
                key={index}
                ballotType={ballotType}
                index={index}
                onUpdate={updateBallotType}
                onDelete={deleteBallotType}
                candidates={candidates}
              />
            ))}
          </div>
          
          <button
            onClick={addBallotType}
            style={{ ...styles.button, marginTop: '16px' }}
          >
            <PlusIcon />
            Add New Ballot Type
          </button>
        </div>
        
        <div style={styles.card}>
          <h2 style={{ ...styles.h2, textAlign: 'center', marginBottom: '32px' }}>
            Winners by Method
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            {methods.map((method) => (
              <div 
                key={method.name}
                style={{
                  ...styles.methodCard,
                  borderColor: method.borderColor,
                  backgroundColor: method.bgColor
                }}
              >
                <div style={{ ...styles.methodIcon, color: method.color }}>
                  {method.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  {method.name}
                </h3>
                <p style={{ ...styles.winner, color: method.color }}>
                  {method.winner || 'No clear winner'}
                </p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  {method.description}
                </p>
              </div>
            ))}
          </div>
          
          {methods.filter(m => m.winner).map(m => m.winner).filter((v, i, a) => a.indexOf(v) === i).length > 1 && (
            <div style={styles.warningAlert}>
              <AlertIcon />
              <p style={{ fontWeight: '500' }}>
                Different methods produce different winners! This shows why the choice of voting method matters.
              </p>
            </div>
          )}
        </div>
        
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={styles.h2}>Detailed Explanations</h2>
            <button
              onClick={() => setShowExplanations(!showExplanations)}
              style={styles.button}
            >
              <SchoolIcon />
              {showExplanations ? 'Hide' : 'Show'} Explanations
            </button>
          </div>
          
          {showExplanations && (
            <div>
              <div style={styles.tabs}>
                {methods.map((method, index) => (
                  <button
                    key={method.name}
                    onClick={() => setActiveTab(index)}
                    style={{
                      ...styles.tab,
                      ...(activeTab === index ? styles.tabActive : {})
                    }}
                  >
                    {method.name}
                  </button>
                ))}
              </div>
              
              <div style={{ marginTop: '24px' }}>
                {activeTab === 0 && (
                  <ConsensusChoiceExplanation 
                    ballotTypes={ballotTypes}
                    candidates={candidates}
                    winner={consensusWinner}
                  />
                )}
                {activeTab === 1 && (
                  <PluralityExplanation 
                    ballotTypes={ballotTypes}
                    candidates={candidates}
                    winner={pluralityWinner}
                  />
                )}
                {activeTab === 2 && (
                  <IRVExplanation 
                    ballotTypes={ballotTypes}
                    candidates={candidates}
                    winner={irvWinner}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingMethodsDemo;