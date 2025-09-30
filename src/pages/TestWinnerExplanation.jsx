import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  TextField,
  Divider,
  Chip,
  IconButton,
  Collapse,
  Alert,
  alpha,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import WinnerExplanation from '../components/WinnerExplanation';

/**
 * TestWinnerExplanation Component - Enhanced Version
 * 
 * A comprehensive testing harness to:
 * 1. Test all winner scenarios
 * 2. View the output and suggest improvements
 * 3. Edit test data on the fly
 * 4. Export scenarios for unit tests
 */
const TestWinnerExplanation = () => {
  const [scenario, setScenario] = useState('condorcet');
  const [showData, setShowData] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [customData, setCustomData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Comprehensive test scenarios
  const scenarios = {
condorcet: {
      "name": "Condorcet Winner - Clear",
      "notes": "Alice beats everyone head-to-head",
      "expectedBehavior": "Should show green bars for Alice",
      "results": {
        "poll_id": "test_poll",
        "calculated_at": "2025-06-06T21:39:40.792039",
        "total_voters": 100,
        "total_ballots": 100,
        "num_candidates": 3,
        "candidates": [
          "Alice",
          "Bob",
          "Charlie"
        ],
        "ballot_types": [
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Bob"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 50,
            "percentage": 50.0
          },
          {
            "ranking": [
              [
                "Bob"
              ],
              [
                "Alice"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 30,
            "percentage": 30.0
          },
          {
            "ranking": [
              [
                "Charlie"
              ],
              [
                "Alice"
              ]
            ],
            "count": 10,
            "percentage": 10.0
          },
          {
            "ranking": [
              [
                "Bob"
              ]
            ],
            "count": 10,
            "percentage": 10.0
          }
        ],
        "condorcet_winner": "Alice",
        "weak_condorcet_winners": [],
        "winner_type": "condorcet",
        "determined_winner": "Alice",
        "tied_winners": [],
        "is_tie": false,
        "candidate_records": [
          {
            "candidate": "Alice",
            "wins": 2,
            "losses": 0,
            "ties": 0,
            "copeland_score": 2.0,
            "minimax_score": 0.0,
            "net_wins": 2,
            "opponents": [
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 20
              },
              {
                "opponent": "Charlie",
                "result": "win",
                "margin": 70
              }
            ],
            "worst_loss_margin": 0
          },
          {
            "candidate": "Bob",
            "wins": 1,
            "losses": 1,
            "ties": 0,
            "copeland_score": 0.0,
            "minimax_score": -20.0,
            "net_wins": 0,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -20
              },
              {
                "opponent": "Charlie",
                "result": "win",
                "margin": 80
              }
            ],
            "worst_loss_margin": 20
          },
          {
            "candidate": "Charlie",
            "wins": 0,
            "losses": 2,
            "ties": 0,
            "copeland_score": -2.0,
            "minimax_score": -80.0,
            "net_wins": -2,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -70
              },
              {
                "opponent": "Bob",
                "result": "loss",
                "margin": -80
              }
            ],
            "worst_loss_margin": 80
          }
        ]
      },
      "winner": "Alice",
      "tiedWinners": [],
      "winnerType": "condorcet",
      "hasTie": false
    },
    condorcet2: {
      "name": "Condorcet Winner ",
      "notes": "Alice beats everyone head-to-head",
      "expectedBehavior": "Should show green bars for Alice",
      "results": {
        "poll_id": "test_poll",
        "calculated_at": "2025-06-06T23:31:45.090476",
        "total_voters": "77",
        "total_ballots": 77,
        "num_candidates": 4,
        "candidates": [
          "Alice",
          "Bob",
          "Charlie",
          "David"
        ],
        "ballot_types": [
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Bob"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 50,
            "percentage": 64.94
          },
          {
            "ranking": [
              [
                "Bob"
              ],
              [
                "Alice"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 20,
            "percentage": 25.97
          },
          {
            "ranking": [
              [
                "Charlie"
              ],
              [
                "Alice"
              ]
            ],
            "count": 3,
            "percentage": 3.9
          },
          {
            "ranking": [
              [
                "Bob"
              ]
            ],
            "count": 2,
            "percentage": 2.6
          },
          {
            "ranking": [
              [
                "David"
              ],
              [
                "Alice"
              ],
              [
                "Bob"
              ]
            ],
            "count": 1,
            "percentage": 1.3
          },
          {
            "ranking": [
              [
                "David"
              ]
            ],
            "count": 1,
            "percentage": 1.3
          }
        ],
        "condorcet_winner": "Alice",
        "weak_condorcet_winners": [],
        "winner_type": "condorcet",
        "determined_winner": "Alice",
        "tied_winners": [],
        "is_tie": false,
        "candidate_records": [
          {
            "candidate": "Alice",
            "wins": 3,
            "losses": 0,
            "ties": 0,
            "copeland_score": 3.0,
            "minimax_score": 0.0,
            "net_wins": 3,
            "opponents": [
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 32
              },
              {
                "opponent": "Charlie",
                "result": "win",
                "margin": 68
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 71
              }
            ],
            "worst_loss_margin": 0
          },
          {
            "candidate": "Bob",
            "wins": 2,
            "losses": 1,
            "ties": 0,
            "copeland_score": 1.0,
            "minimax_score": -32.0,
            "net_wins": 1,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -32
              },
              {
                "opponent": "Charlie",
                "result": "win",
                "margin": 70
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 70
              }
            ],
            "worst_loss_margin": 32
          },
          {
            "candidate": "Charlie",
            "wins": 1,
            "losses": 2,
            "ties": 0,
            "copeland_score": -1.0,
            "minimax_score": -70.0,
            "net_wins": -1,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -68
              },
              {
                "opponent": "Bob",
                "result": "loss",
                "margin": -70
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 71
              }
            ],
            "worst_loss_margin": 70
          },
          {
            "candidate": "David",
            "wins": 0,
            "losses": 3,
            "ties": 0,
            "copeland_score": -3.0,
            "minimax_score": -71.0,
            "net_wins": -3,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -71
              },
              {
                "opponent": "Bob",
                "result": "loss",
                "margin": -70
              },
              {
                "opponent": "Charlie",
                "result": "loss",
                "margin": -71
              }
            ],
            "worst_loss_margin": 71
          }
        ]
      },
      "winner": "Alice",
      "tiedWinners": [],
      "winnerType": "condorcet",
      "hasTie": false
    },  
        condorcet3: {
      "name": "Condorcet Winner ",
      "notes": "Alice beats everyone head-to-head",
      "expectedBehavior": "Should show green bars for Alice",
      "results": {
        "poll_id": "test_poll",
        "calculated_at": "2025-06-07T00:39:35.468396",
        "total_voters": "2",
        "total_ballots": 2,
        "num_candidates": 4,
        "candidates": [
          "Alice",
          "Bob",
          "Charlie",
          "David"
        ],
        "ballot_types": [
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Bob"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 1,
            "percentage": 50.0
          },
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Charlie"
              ],
              [
                "Bob"
              ]
            ],
            "count": 1,
            "percentage": 50.0
          }
        ],
        "condorcet_winner": "Alice",
        "weak_condorcet_winners": [],
        "winner_type": "condorcet",
        "determined_winner": "Alice",
        "tied_winners": [],
        "is_tie": false,
        "candidate_records": [
          {
            "candidate": "Alice",
            "wins": 3,
            "losses": 0,
            "ties": 0,
            "copeland_score": 3.0,
            "minimax_score": 0.0,
            "net_wins": 3,
            "opponents": [
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 2
              },
              {
                "opponent": "Charlie",
                "result": "win",
                "margin": 2
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 2
              }
            ],
            "worst_loss_margin": 0
          },
          {
            "candidate": "Bob",
            "wins": 1,
            "losses": 1,
            "ties": 1,
            "copeland_score": 0.0,
            "minimax_score": -2.0,
            "net_wins": 0,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -2
              },
              {
                "opponent": "Charlie",
                "result": "tie",
                "margin": 0
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 2
              }
            ],
            "worst_loss_margin": 2
          },
          {
            "candidate": "Charlie",
            "wins": 1,
            "losses": 1,
            "ties": 1,
            "copeland_score": 0.0,
            "minimax_score": -2.0,
            "net_wins": 0,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -2
              },
              {
                "opponent": "Bob",
                "result": "tie",
                "margin": 0
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 2
              }
            ],
            "worst_loss_margin": 2
          },
          {
            "candidate": "David",
            "wins": 0,
            "losses": 3,
            "ties": 0,
            "copeland_score": -3.0,
            "minimax_score": -2.0,
            "net_wins": -3,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -2
              },
              {
                "opponent": "Bob",
                "result": "loss",
                "margin": -2
              },
              {
                "opponent": "Charlie",
                "result": "loss",
                "margin": -2
              }
            ],
            "worst_loss_margin": 2
          }
        ]
      },
      "winner": "Alice",
      "tiedWinners": [],
      "winnerType": "condorcet",
      "hasTie": false
    },
        weak_condorcet: {
      "name": "Weak Condorcet Winner ",
      "notes": "Alice doesn't lose to anyone ",
      "expectedBehavior": "Should show green bars for Alice",
      "results": {
        "poll_id": "test_poll",
        "calculated_at": "2025-06-07T00:09:41.429805",
        "total_voters": "4",
        "total_ballots": 4,
        "num_candidates": 3,
        "candidates": [
          "Alice",
          "Bob",
          "Charlie"
        ],
        "ballot_types": [
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Bob"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 2,
            "percentage": 50.0
          },
          {
            "ranking": [
              [
                "Charlie"
              ],
              [
                "Alice"
              ],
              [
                "Bob"
              ]
            ],
            "count": 1,
            "percentage": 25.0
          },
          {
            "ranking": [
              [
                "Bob"
              ],
              [
                "Charlie"
              ],
              [
                "Alice"
              ]
            ],
            "count": 1,
            "percentage": 25.0
          }
        ],
        "condorcet_winner": null,
        "weak_condorcet_winners": [
          "Alice"
        ],
        "winner_type": "weak_condorcet",
        "determined_winner": "Alice",
        "tied_winners": [],
        "is_tie": false,
        "candidate_records": [
          {
            "candidate": "Alice",
            "wins": 1,
            "losses": 0,
            "ties": 1,
            "copeland_score": 1.0,
            "minimax_score": 0.0,
            "net_wins": 1,
            "opponents": [
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 2
              },
              {
                "opponent": "Charlie",
                "result": "tie",
                "margin": 0
              }
            ],
            "worst_loss_margin": 0
          },
          {
            "candidate": "Bob",
            "wins": 1,
            "losses": 1,
            "ties": 0,
            "copeland_score": 0.0,
            "minimax_score": -2.0,
            "net_wins": 0,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -2
              },
              {
                "opponent": "Charlie",
                "result": "win",
                "margin": 2
              }
            ],
            "worst_loss_margin": 2
          },
          {
            "candidate": "Charlie",
            "wins": 0,
            "losses": 1,
            "ties": 1,
            "copeland_score": -1.0,
            "minimax_score": -2.0,
            "net_wins": -1,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "tie",
                "margin": 0
              },
              {
                "opponent": "Bob",
                "result": "loss",
                "margin": -2
              }
            ],
            "worst_loss_margin": 2
          }
        ]
      },
      "winner": "Alice",
      "tiedWinners": [],
      "winnerType": "weak_condorcet",
      "hasTie": false
    },

     copeland_winner: {
      "name": "No (Weak) Condorcet Winner, but Copeland Winner",
      "notes": "Multiple Weak Condorcet winners, but Copeland winner is Alice",
      "expectedBehavior": "Should explain why Alice is the winner despite no (Weak) Condorcet winner",
      "results": {
        "poll_id": "test_poll",
        "calculated_at": "2025-06-08T18:14:23.409925",
        "total_voters": "4",
        "total_ballots": 4,
        "num_candidates": 3,
        "candidates": [
          "Alice",
          "Bob",
          "Charlie"
        ],
        "ballot_types": [
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Bob"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 2,
            "percentage": 50.0
          },
          {
            "ranking": [
              [
                "Charlie"
              ],
              [
                "Bob"
              ],
              [
                "Alice"
              ]
            ],
            "count": 1,
            "percentage": 25.0
          },
          {
            "ranking": [
              [
                "Charlie"
              ],
              [
                "Alice"
              ],
              [
                "Bob"
              ]
            ],
            "count": 1,
            "percentage": 25.0
          }
        ],
        "condorcet_winner": null,
        "weak_condorcet_winners": [
          "Alice",
          "Charlie"
        ],
        "winner_type": "copeland",
        "determined_winner": "Alice",
        "tied_winners": [],
        "is_tie": false,
        "candidate_records": [
          {
            "candidate": "Alice",
            "wins": 1,
            "losses": 0,
            "ties": 1,
            "copeland_score": 1.0,
            "minimax_score": 0.0,
            "net_wins": 1,
            "opponents": [
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 2
              },
              {
                "opponent": "Charlie",
                "result": "tie",
                "margin": 0
              }
            ],
            "worst_loss_margin": 0
          },
          {
            "candidate": "Charlie",
            "wins": 0,
            "losses": 0,
            "ties": 2,
            "copeland_score": 0.0,
            "minimax_score": 0.0,
            "net_wins": 0,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "tie",
                "margin": 0
              },
              {
                "opponent": "Bob",
                "result": "tie",
                "margin": 0
              }
            ],
            "worst_loss_margin": 0
          },
          {
            "candidate": "Bob",
            "wins": 0,
            "losses": 1,
            "ties": 1,
            "copeland_score": -1.0,
            "minimax_score": -2.0,
            "net_wins": -1,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -2
              },
              {
                "opponent": "Charlie",
                "result": "tie",
                "margin": 0
              }
            ],
            "worst_loss_margin": 2
          }
        ]
      },
      "winner": "Alice",
      "tiedWinners": [],
      "winnerType": "copeland",
      "hasTie": false
    },

    copeland_winner2: {
      "name": "No (Weak) Condorcet Winner, but Copeland Winner",
      "notes": "Multiple Weak Condorcet winners, but Copeland winner is Alice",
      "expectedBehavior": "Should explain why Alice is the winner despite no (Weak) Condorcet winner",
      "results": {
        "poll_id": "test_poll",
        "calculated_at": "2025-06-07T14:12:26.075475",
        "total_voters": "10",
        "total_ballots": 10,
        "num_candidates": 4,
        "candidates": [
          "Alice",
          "Bob",
          "Charlie",
          "David"
        ],
        "ballot_types": [
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Charlie"
              ],
              [
                "David"
              ],
              [
                "Bob"
              ]
            ],
            "count": 2,
            "percentage": 20.0
          },
          {
            "ranking": [
              [
                "Charlie"
              ],
              [
                "Bob"
              ],
              [
                "Alice"
              ],
              [
                "David"
              ]
            ],
            "count": 2,
            "percentage": 20.0
          },
          {
            "ranking": [
              [
                "David"
              ],
              [
                "Bob"
              ],
              [
                "Alice"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 1,
            "percentage": 10.0
          },
          {
            "ranking": [
              [
                "Bob"
              ],
              [
                "Alice"
              ],
              [
                "David"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 1,
            "percentage": 10.0
          },
          {
            "ranking": [
              [
                "David"
              ],
              [
                "Alice"
              ],
              [
                "Bob"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 1,
            "percentage": 10.0
          },
          {
            "ranking": [
              [
                "David"
              ],
              [
                "Charlie"
              ],
              [
                "Bob"
              ],
              [
                "Alice"
              ]
            ],
            "count": 1,
            "percentage": 10.0
          },
          {
            "ranking": [
              [
                "Bob"
              ],
              [
                "Charlie"
              ],
              [
                "David"
              ],
              [
                "Alice"
              ]
            ],
            "count": 1,
            "percentage": 10.0
          },
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "David"
              ],
              [
                "Charlie"
              ],
              [
                "Bob"
              ]
            ],
            "count": 1,
            "percentage": 10.0
          }
        ],
        "condorcet_winner": null,
        "weak_condorcet_winners": [],
        "winner_type": "copeland",
        "determined_winner": "Alice",
        "tied_winners": [],
        "is_tie": false,
        "candidate_records": [
          {
            "candidate": "Alice",
            "wins": 2,
            "losses": 1,
            "ties": 0,
            "copeland_score": 1.0,
            "minimax_score": -2.0,
            "net_wins": 1,
            "opponents": [
              {
                "opponent": "Bob",
                "result": "loss",
                "margin": -2
              },
              {
                "opponent": "Charlie",
                "result": "win",
                "margin": 2
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 2
              }
            ],
            "worst_loss_margin": 2
          },
          {
            "candidate": "Charlie",
            "wins": 1,
            "losses": 1,
            "ties": 1,
            "copeland_score": 0.0,
            "minimax_score": -2.0,
            "net_wins": 0,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -2
              },
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 2
              },
              {
                "opponent": "David",
                "result": "tie",
                "margin": 0
              }
            ],
            "worst_loss_margin": 2
          },
          {
            "candidate": "David",
            "wins": 1,
            "losses": 1,
            "ties": 1,
            "copeland_score": 0.0,
            "minimax_score": -2.0,
            "net_wins": 0,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -2
              },
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 2
              },
              {
                "opponent": "Charlie",
                "result": "tie",
                "margin": 0
              }
            ],
            "worst_loss_margin": 2
          },
          {
            "candidate": "Bob",
            "wins": 1,
            "losses": 2,
            "ties": 0,
            "copeland_score": -1.0,
            "minimax_score": -2.0,
            "net_wins": -1,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "win",
                "margin": 2
              },
              {
                "opponent": "Charlie",
                "result": "loss",
                "margin": -2
              },
              {
                "opponent": "David",
                "result": "loss",
                "margin": -2
              }
            ],
            "worst_loss_margin": 2
          }
        ]
      },
      "winner": "Alice",
      "tiedWinners": [],
      "winnerType": "copeland",
      "hasTie": false
    },

    minimax_winner: {
      "name": "No (Weak) Condorcet Winner, no Copeland Winner, Minimax Winner",
      "notes": "Multiple Weak Condorcet winners, multiple Copeland winners, but Minimax winner is Alice",
      "expectedBehavior": "Should explain why Alice is the winner despite no (Weak) Condorcet winner and no unique Copeland winner",
      "results": {
        "poll_id": "test_poll",
        "calculated_at": "2025-06-07T14:34:09.583887",
        "total_voters": "7",
        "total_ballots": 7,
        "num_candidates": 4,
        "candidates": [
          "Alice",
          "Bob",
          "Charlie",
          "David"
        ],
        "ballot_types": [
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Charlie"
              ],
              [
                "David"
              ],
              [
                "Bob"
              ]
            ],
            "count": 1,
            "percentage": 14.29
          },
          {
            "ranking": [
              [
                "David"
              ],
              [
                "Alice"
              ],
              [
                "Bob"
              ],
              [
                "Charlie"
              ]
            ],
            "count": 1,
            "percentage": 14.29
          },
          {
            "ranking": [
              [
                "Bob"
              ],
              [
                "Alice"
              ],
              [
                "Charlie"
              ],
              [
                "David"
              ]
            ],
            "count": 1,
            "percentage": 14.29
          },
          {
            "ranking": [
              [
                "Charlie"
              ],
              [
                "David"
              ],
              [
                "Alice"
              ],
              [
                "Bob"
              ]
            ],
            "count": 1,
            "percentage": 14.29
          },
          {
            "ranking": [
              [
                "David"
              ],
              [
                "Alice"
              ],
              [
                "Charlie"
              ],
              [
                "Bob"
              ]
            ],
            "count": 1,
            "percentage": 14.29
          },
          {
            "ranking": [
              [
                "Charlie"
              ],
              [
                "David"
              ],
              [
                "Bob"
              ],
              [
                "Alice"
              ]
            ],
            "count": 1,
            "percentage": 14.29
          },
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Charlie"
              ],
              [
                "Bob"
              ],
              [
                "David"
              ]
            ],
            "count": 1,
            "percentage": 14.29
          }
        ],
        "condorcet_winner": null,
        "weak_condorcet_winners": [],
        "winner_type": "minimax",
        "determined_winner": "Alice",
        "tied_winners": [],
        "is_tie": false,
        "candidate_records": [
          {
            "candidate": "Alice",
            "wins": 2,
            "losses": 1,
            "ties": 0,
            "copeland_score": 1.0,
            "minimax_score": -1.0,
            "net_wins": 1,
            "opponents": [
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 3
              },
              {
                "opponent": "Charlie",
                "result": "win",
                "margin": 3
              },
              {
                "opponent": "David",
                "result": "loss",
                "margin": -1
              }
            ],
            "worst_loss_margin": 1
          },
          {
            "candidate": "Charlie",
            "wins": 2,
            "losses": 1,
            "ties": 0,
            "copeland_score": 1.0,
            "minimax_score": -3.0,
            "net_wins": 1,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -3
              },
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 3
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 3
              }
            ],
            "worst_loss_margin": 3
          },
          {
            "candidate": "David",
            "wins": 2,
            "losses": 1,
            "ties": 0,
            "copeland_score": 1.0,
            "minimax_score": -3.0,
            "net_wins": 1,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "win",
                "margin": 1
              },
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 3
              },
              {
                "opponent": "Charlie",
                "result": "loss",
                "margin": -3
              }
            ],
            "worst_loss_margin": 3
          },
          {
            "candidate": "Bob",
            "wins": 0,
            "losses": 3,
            "ties": 0,
            "copeland_score": -3.0,
            "minimax_score": -3.0,
            "net_wins": -3,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -3
              },
              {
                "opponent": "Charlie",
                "result": "loss",
                "margin": -3
              },
              {
                "opponent": "David",
                "result": "loss",
                "margin": -3
              }
            ],
            "worst_loss_margin": 3
          }
        ]
      },
      "winner": "Alice",
      "tiedWinners": [],
      "winnerType": "minimax",
      "hasTie": false
    },
        tied_winners1: {
      "name": "Tied winners",
      "notes": "Multiple Weak Condorcet winners/Copeland winners",
      "expectedBehavior": "Should explain why there is a tie",
      "results": {
        "poll_id": "test_poll",
        "calculated_at": "2025-06-07T16:56:38.430199",
        "total_voters": "3",
        "total_ballots": 3,
        "num_candidates": 4,
        "candidates": [
          "Alice",
          "Bob",
          "Charlie",
          "David"
        ],
        "ballot_types": [
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Bob"
              ],
              [
                "Charlie"
              ],
              [
                "David"
              ]
            ],
            "count": 1,
            "percentage": 33.33
          },
          {
            "ranking": [
              [
                "Bob"
              ],
              [
                "Charlie"
              ],
              [
                "Alice"
              ],
              [
                "David"
              ]
            ],
            "count": 1,
            "percentage": 33.33
          },
          {
            "ranking": [
              [
                "Charlie"
              ],
              [
                "Alice"
              ],
              [
                "Bob"
              ],
              [
                "David"
              ]
            ],
            "count": 1,
            "percentage": 33.33
          }
        ],
        "condorcet_winner": null,
        "weak_condorcet_winners": [],
        "winner_type": "tie_minimax",
        "determined_winner": null,
        "tied_winners": [
          "Alice",
          "Bob",
          "Charlie"
        ],
        "is_tie": true,
        "candidate_records": [
          {
            "candidate": "Alice",
            "wins": 2,
            "losses": 1,
            "ties": 0,
            "copeland_score": 1.0,
            "minimax_score": -1.0,
            "net_wins": 1,
            "opponents": [
              {
                "opponent": "Bob",
                "result": "win",
                "margin": 1
              },
              {
                "opponent": "Charlie",
                "result": "loss",
                "margin": -1
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 3
              }
            ],
            "worst_loss_margin": 1
          },
          {
            "candidate": "Bob",
            "wins": 2,
            "losses": 1,
            "ties": 0,
            "copeland_score": 1.0,
            "minimax_score": -1.0,
            "net_wins": 1,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -1
              },
              {
                "opponent": "Charlie",
                "result": "win",
                "margin": 1
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 3
              }
            ],
            "worst_loss_margin": 1
          },
          {
            "candidate": "Charlie",
            "wins": 2,
            "losses": 1,
            "ties": 0,
            "copeland_score": 1.0,
            "minimax_score": -1.0,
            "net_wins": 1,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "win",
                "margin": 1
              },
              {
                "opponent": "Bob",
                "result": "loss",
                "margin": -1
              },
              {
                "opponent": "David",
                "result": "win",
                "margin": 3
              }
            ],
            "worst_loss_margin": 1
          },
          {
            "candidate": "David",
            "wins": 0,
            "losses": 3,
            "ties": 0,
            "copeland_score": -3.0,
            "minimax_score": -3.0,
            "net_wins": -3,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "loss",
                "margin": -3
              },
              {
                "opponent": "Bob",
                "result": "loss",
                "margin": -3
              },
              {
                "opponent": "Charlie",
                "result": "loss",
                "margin": -3
              }
            ],
            "worst_loss_margin": 3
          }
        ]
      },
      "winner": null,
      "tiedWinners": [
        "Alice",
        "Bob",
        "Charlie"
      ],
      "winnerType": "tie_minimax",
      "hasTie": true
    },
    tied_winners2: {
      "name": "Tied winners",
      "notes": "Multiple Weak Condorcet winners/Copeland winners",
      "expectedBehavior": "Should explain why there is a tie",
      "results": {
        "poll_id": "test_poll",
        "calculated_at": "2025-06-07T17:44:07.350884",
        "total_voters": "1000",
        "total_ballots": 1000,
        "num_candidates": 2,
        "candidates": [
          "Alice",
          "Bob"
        ],
        "ballot_types": [
          {
            "ranking": [
              [
                "Alice"
              ],
              [
                "Bob"
              ]
            ],
            "count": 500,
            "percentage": 50.0
          },
          {
            "ranking": [
              [
                "Bob"
              ],
              [
                "Alice"
              ]
            ],
            "count": 500,
            "percentage": 50.0
          }
        ],
        "condorcet_winner": null,
        "weak_condorcet_winners": [
          "Alice",
          "Bob"
        ],
        "winner_type": "tie_minimax",
        "determined_winner": null,
        "tied_winners": [
          "Alice",
          "Bob"
        ],
        "is_tie": true,
        "candidate_records": [
          {
            "candidate": "Alice",
            "wins": 0,
            "losses": 0,
            "ties": 1,
            "copeland_score": 0.0,
            "minimax_score": 0.0,
            "net_wins": 0,
            "opponents": [
              {
                "opponent": "Bob",
                "result": "tie",
                "margin": 0
              }
            ],
            "worst_loss_margin": 0
          },
          {
            "candidate": "Bob",
            "wins": 0,
            "losses": 0,
            "ties": 1,
            "copeland_score": 0.0,
            "minimax_score": 0.0,
            "net_wins": 0,
            "opponents": [
              {
                "opponent": "Alice",
                "result": "tie",
                "margin": 0
              }
            ],
            "worst_loss_margin": 0
          }
        ]
      },
      "winner": null,
      "tiedWinners": [
        "Alice",
        "Bob"
      ],
      "winnerType": "tie_minimax",
      "hasTie": true
    },
    
  };
  
  const currentScenario = customData || scenarios[scenario];
  
  const handleExportScenario = () => {
    const dataStr = JSON.stringify(currentScenario, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `winner-explanation-${scenario}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  const handleEditData = () => {
    setEditMode(true);
    setCustomData(JSON.parse(JSON.stringify(currentScenario)));
  };
  
  const handleSaveEdit = () => {
    setEditMode(false);
    // customData is already being used
  };
  
  const handleCancelEdit = () => {
    setEditMode(false);
    setCustomData(null);
  };
  
  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>

    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          WinnerExplanation Test Harness
        </Typography>
        
        <Grid container spacing={3} alignItems="flex-start" sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Scenario</InputLabel>
              <Select
                value={scenario}
                onChange={(e) => {
                  setScenario(e.target.value);
                  setCustomData(null);
                  setEditMode(false);
                }}
                label="Scenario"
              >
                <MenuItem value="condorcet">Condorcet Winner 1</MenuItem>
                <MenuItem value="condorcet2">Condorcet Winner 2</MenuItem>
                <MenuItem value="condorcet3">Condorcet Winner 3</MenuItem>
                <MenuItem value="weak_condorcet">Weak Condorcet Winner</MenuItem>
                <MenuItem value="copeland_winner">Copeland Winner 1</MenuItem>
                <MenuItem value="copeland_winner2">Copeland Winner 2</MenuItem>
                <MenuItem value="minimax_winner">Minimax Winner</MenuItem>
                <MenuItem value="tied_winners1">Tied Winners 1</MenuItem>
                <MenuItem value="tied_winners2">Tied Winners 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Winner Type:</strong> {currentScenario.winnerType}<br />
                    <strong>Winner:</strong> {currentScenario.winner || 'Tied'}<br />
                    <strong>Has Tie:</strong> {currentScenario.hasTie ? 'Yes' : 'No'}
                    {currentScenario.hasTie && (
                      <><br /><strong>Tied Winners:</strong> {currentScenario.tiedWinners.join(', ')}</>
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Total Voters:</strong> {currentScenario.results.total_voters}<br />
                    <strong>Candidates:</strong> {currentScenario.results.candidates.length}<br />
                    <strong>Ballot Types:</strong> {currentScenario.results.ballot_types.length}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
        
        {/* Notes Section */}
        <Box sx={{ mb: 3 }}>
          <Button
            size="small"
            onClick={() => setShowNotes(!showNotes)}
            endIcon={showNotes ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            Scenario Notes
          </Button>
          <Collapse in={showNotes}>
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Scenario:</strong> {scenarios[scenario]?.notes || 'Custom scenario'}<br />
                <strong>Expected:</strong> {scenarios[scenario]?.expectedBehavior || 'Check the output below'}
              </Typography>
            </Alert>
          </Collapse>
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Current scenario data:', currentScenario);
            }}
            startIcon={<CodeIcon />}
          >
            Log to Console
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleExportScenario}
          >
            Export Scenario
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => {
              // Force re-render to test animations
              const temp = scenario;
              setScenario('condorcet');
              setTimeout(() => setScenario(temp), 100);
            }}
            startIcon={<RefreshIcon />}
          >
            Test Animation
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => setShowData(!showData)}
            endIcon={showData ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {showData ? 'Hide' : 'Show'} Raw Data
          </Button>
          
          {!editMode ? (
            <Button
              variant="outlined"
              onClick={handleEditData}
            >
              Edit Data
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={handleSaveEdit}
                color="success"
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancelEdit}
                color="error"
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
        
        {/* Raw Data Section */}
        <Collapse in={showData}>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Raw Data:</Typography>
            {editMode ? (
              <TextField
                fullWidth
                multiline
                rows={15}
                value={JSON.stringify(customData, null, 2)}
                onChange={(e) => {
                  try {
                    setCustomData(JSON.parse(e.target.value));
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                sx={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            ) : (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <pre style={{ margin: 0, fontSize: 12, overflow: 'auto' }}>
                  {JSON.stringify(currentScenario, null, 2)}
                </pre>
              </Paper>
            )}
          </Box>
        </Collapse>
      </Paper>
      
      <Paper elevation={0} sx={{ p: 4, border: '2px solid', borderColor: 'primary.main' }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
          WinnerExplanation Output:
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <WinnerExplanation
          results={currentScenario.results}
          winner={currentScenario.winner}
          tiedWinners={currentScenario.tiedWinners}
          winnerType={currentScenario.winnerType}
          hasTie={currentScenario.hasTie}
        />
      </Paper>
      
      {/* Improvement Suggestions Box */}
      <Paper elevation={1} sx={{ p: 3, mt: 4,  bgcolor: alpha('#ff9800', 0.1) }}>
        <Typography variant="h6" gutterBottom>
          💡 How to Test & Improve:
        </Typography>
        <Typography variant="body2" component="div">
          <ol style={{ marginTop: 8 }}>
            <li>Try each scenario and see if the explanation is clear</li>
            <li>Click "Show Raw Data" to understand the data structure</li>
            <li>Use "Edit Data" to modify scenarios and test edge cases</li>
            <li>Check if animations work properly with "Test Animation"</li>
            <li>Look for:
              <ul>
                <li>Unclear language that could be simplified</li>
                <li>Missing information that would help understanding</li>
                <li>Visual elements that could be improved</li>
                <li>Edge cases that break the display</li>
              </ul>
            </li>
            <li>Export scenarios that need fixes to share with developers</li>
          </ol>
        </Typography>
      </Paper>
    </Container>
    </Box>
  );
};

export default TestWinnerExplanation;