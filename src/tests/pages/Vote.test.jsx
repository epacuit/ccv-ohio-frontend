import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Vote from '../../pages/Vote';
import API from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock CSS utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: (transform) => transform ? 'transform' : '',
    },
  },
}));

// Mock useParams and useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ pollId: 'test-poll-123' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock drag and drop
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => children,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(),
  DragOverlay: ({ children }) => children,
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((arr, from, to) => {
    const newArr = [...arr];
    const [removed] = newArr.splice(from, 1);
    newArr.splice(to, 0, removed);
    return newArr;
  }),
  SortableContext: ({ children }) => children,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

// Sample poll data
const mockPoll = {
  id: 'test-poll-123',
  title: 'Test Election',
  description: 'Choose your favorite option',
  options: [
    { id: 'opt-1', name: 'Alice' },
    { id: 'opt-2', name: 'Bob' },
    { id: 'opt-3', name: 'Charlie' },
    { id: 'opt-4', name: 'David' },
  ],
  settings: {
    allow_ties: true,
    require_complete_ranking: false,
    randomize_options: true,
    allow_write_in: false,
  },
};

const renderVote = () => {
  return render(
    <BrowserRouter>
      <Vote />
    </BrowserRouter>
  );
};

describe('Vote Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Loading and Error States', () => {
    it('should show loading spinner initially', () => {
      API.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderVote();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show error message when poll fails to load', async () => {
      API.get.mockRejectedValueOnce(new Error('Network error'));
      renderVote();
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load poll/)).toBeInTheDocument();
      });
    });

    it('should load and display poll information', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Test Election')).toBeInTheDocument();
        expect(screen.getByText('Choose your favorite option')).toBeInTheDocument();
      });
    });
  });

  describe('Voting Rules Display', () => {
    it('should display correct voting rules for ties allowed', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText(/You can rank multiple candidates equally/)).toBeInTheDocument();
        expect(screen.getByText(/You don't need to rank all candidates/)).toBeInTheDocument();
      });
    });

    it('should display complete ranking required rule', async () => {
      const pollWithCompleteRanking = {
        ...mockPoll,
        settings: { ...mockPoll.settings, require_complete_ranking: true },
      };
      API.get.mockResolvedValueOnce({ data: pollWithCompleteRanking });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText(/You must rank all candidates/)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between drag-drop and table views', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Drag & Drop')).toBeInTheDocument();
      });

      // Initially on drag-drop tab
      expect(screen.getByText('Available Candidates')).toBeInTheDocument();

      // Switch to table tab
      const tableTab = screen.getByRole('tab', { name: /Table View/i });
      fireEvent.click(tableTab);

      // Should show table headers
      expect(screen.getByText('1st')).toBeInTheDocument();
      expect(screen.getByText('2nd')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Interface', () => {
    it('should move candidate from unranked to ranked', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Available Candidates')).toBeInTheDocument();
      });

      // Find the Available Candidates card
      const availableCard = screen.getByText('Available Candidates').parentElement.querySelector('.MuiCard-root');
      const aliceBox = within(availableCard).getByText('Alice').closest('.MuiBox-root');
      
      // Click to add to ranking
      fireEvent.click(aliceBox);

      // Find the Your Ranking card
      const rankingCard = screen.getByText('Your Ranking').parentElement.querySelector('.MuiCard-root');
      expect(within(rankingCard).getByText('Alice')).toBeInTheDocument();
      expect(within(rankingCard).getByText('Rank 1')).toBeInTheDocument();
    });

    it('should remove candidate from ranking', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Available Candidates')).toBeInTheDocument();
      });

      // Add Alice to ranking first
      const availableCard = screen.getByText('Available Candidates').parentElement.querySelector('.MuiCard-root');
      const aliceBox = within(availableCard).getByText('Alice').closest('.MuiBox-root');
      fireEvent.click(aliceBox);

      // Find and click remove button in ranked section
      const rankingCard = screen.getByText('Your Ranking').parentElement.querySelector('.MuiCard-root');
      const deleteButton = within(rankingCard).getByTestId('DeleteIcon').closest('button');
      fireEvent.click(deleteButton);

      // Alice should be back in unranked
      expect(within(availableCard).getByText('Alice')).toBeInTheDocument();
    });

    it('should change candidate rank with arrow buttons', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Available Candidates')).toBeInTheDocument();
      });

      const availableCard = screen.getByText('Available Candidates').parentElement.querySelector('.MuiCard-root');
      
      // Add two candidates
      fireEvent.click(within(availableCard).getByText('Alice').closest('.MuiBox-root'));
      fireEvent.click(within(availableCard).getByText('Bob').closest('.MuiBox-root'));

      // Bob should be rank 2
      const rankingCard = screen.getByText('Your Ranking').parentElement.querySelector('.MuiCard-root');
      expect(within(rankingCard).getByText('Rank 2')).toBeInTheDocument();

      // Find down arrow for Alice (to create tie)
      const downArrows = within(rankingCard).getAllByText('↓');
      fireEvent.click(downArrows[0]);

      // Should now have two at rank 2
      const rank2Chips = within(rankingCard).getAllByText('Rank 2');
      expect(rank2Chips).toHaveLength(2);
    });
  });

  describe('Table Interface', () => {
    it('should mark candidates in table view', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Drag & Drop')).toBeInTheDocument();
      });

      // Switch to table view
      fireEvent.click(screen.getByRole('tab', { name: /Table View/i }));

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Click to assign ranks to candidates')).toBeInTheDocument();
      });

      // Mark Alice as rank 1 using the data-testid
      const aliceRank1 = screen.getByTestId('ballot-mark-opt-1-1');
      fireEvent.click(aliceRank1);

      // Should show ranking summary
      await waitFor(() => {
        expect(screen.getByText('Your current ranking:')).toBeInTheDocument();
        expect(screen.getByText(/Rank 1: Alice/)).toBeInTheDocument();
      });
    });

    it('should allow ties in table view', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Drag & Drop')).toBeInTheDocument();
      });

      // Switch to table view
      const tableTab = screen.getByRole('tab', { name: /Table View/i });
      fireEvent.click(tableTab);

      // Wait for table to be visible
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Click to assign ranks to candidates')).toBeInTheDocument();
      });

      // Mark Alice as rank 1
      const aliceRank1 = screen.getByTestId('ballot-mark-opt-1-1');
      fireEvent.click(aliceRank1);

      // Wait for state update
      await waitFor(() => {
        expect(screen.getByText('Your current ranking:')).toBeInTheDocument();
      });

      // Mark Bob as rank 1
      const bobRank1 = screen.getByTestId('ballot-mark-opt-2-1');
      fireEvent.click(bobRank1);

      // Should show both as rank 1
      await waitFor(() => {
        const chips = screen.getAllByText(/Rank 1: (Alice = Bob|Bob = Alice)/);
        expect(chips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Ballot Submission', () => {
    it('should show error if no candidates ranked', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Submit Ballot')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Submit Ballot'));

      await waitFor(() => {
        expect(screen.getByText(/Please rank at least one candidate/)).toBeInTheDocument();
      });
    });

    it('should show error if complete ranking required but not met', async () => {
      const pollWithCompleteRanking = {
        ...mockPoll,
        settings: { ...mockPoll.settings, require_complete_ranking: true },
      };
      API.get.mockResolvedValueOnce({ data: pollWithCompleteRanking });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Available Candidates')).toBeInTheDocument();
      });

      // Add only one candidate
      const availableCard = screen.getByText('Available Candidates').parentElement.querySelector('.MuiCard-root');
      fireEvent.click(within(availableCard).getByText('Alice').closest('.MuiBox-root'));

      // Try to submit
      fireEvent.click(screen.getByText('Submit Ballot'));

      await waitFor(() => {
        expect(screen.getByText(/This poll requires you to rank all candidates/)).toBeInTheDocument();
      });
    });

    it('should successfully submit valid ballot', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      API.post.mockResolvedValueOnce({ data: { success: true } });
      
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Available Candidates')).toBeInTheDocument();
      });

      // Add candidates
      const availableCard = screen.getByText('Available Candidates').parentElement.querySelector('.MuiCard-root');
      fireEvent.click(within(availableCard).getByText('Alice').closest('.MuiBox-root'));
      fireEvent.click(within(availableCard).getByText('Bob').closest('.MuiBox-root'));

      // Submit
      fireEvent.click(screen.getByText('Submit Ballot'));

      await waitFor(() => {
        expect(API.post).toHaveBeenCalledWith('/ballots/submit', {
          poll_id: 'test-poll-123',
          rankings: [
            { option_id: 'opt-1', rank: 1 },
            { option_id: 'opt-2', rank: 2 },
          ],
        });
      });

      // Should show success message
      expect(screen.getByText(/Ballot submitted successfully/)).toBeInTheDocument();
    });

    it('should redirect to results after successful submission', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      API.post.mockResolvedValueOnce({ data: { success: true } });
      
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Available Candidates')).toBeInTheDocument();
      });

      // Add a candidate and submit
      const availableCard = screen.getByText('Available Candidates').parentElement.querySelector('.MuiCard-root');
      fireEvent.click(within(availableCard).getByText('Alice').closest('.MuiBox-root'));
      fireEvent.click(screen.getByText('Submit Ballot'));

      // Wait for success and navigation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/results/test-poll-123');
      }, { timeout: 3000 });
    });
  });

  describe('Data Synchronization', () => {
    it('should sync data when switching from drag-drop to table', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Available Candidates')).toBeInTheDocument();
      });

      const availableCard = screen.getByText('Available Candidates').parentElement.querySelector('.MuiCard-root');
      
      // Add candidates in drag-drop
      fireEvent.click(within(availableCard).getByText('Alice').closest('.MuiBox-root'));
      fireEvent.click(within(availableCard).getByText('Bob').closest('.MuiBox-root'));

      // Verify rankings before switching
      const rankingCard = screen.getByText('Your Ranking').parentElement.querySelector('.MuiCard-root');
      expect(within(rankingCard).getByText('Rank 1')).toBeInTheDocument();
      expect(within(rankingCard).getByText('Rank 2')).toBeInTheDocument();

      // Switch to table
      const tableTab = screen.getByRole('tab', { name: /Table View/i });
      fireEvent.click(tableTab);

      // Wait for table view to render
      await waitFor(() => {
        expect(screen.getByText('Click to assign ranks to candidates')).toBeInTheDocument();
      });

      // Should show selections in summary
      await waitFor(() => {
        expect(screen.getByText('Your current ranking:')).toBeInTheDocument();
        // Check for chips containing the rankings
        const aliceChip = screen.getByText(/Rank 1: Alice/);
        const bobChip = screen.getByText(/Rank 2: Bob/);
        expect(aliceChip).toBeInTheDocument();
        expect(bobChip).toBeInTheDocument();
      });
    });

    it('should sync data when switching from table to drag-drop', async () => {
      API.get.mockResolvedValueOnce({ data: mockPoll });
      renderVote();

      await waitFor(() => {
        expect(screen.getByText('Drag & Drop')).toBeInTheDocument();
      });

      // Switch to table view
      const tableTab = screen.getByRole('tab', { name: /Table View/i });
      fireEvent.click(tableTab);

      // Wait for table to be visible
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Click to assign ranks to candidates')).toBeInTheDocument();
      });

      // Mark Alice as rank 1 in table
      const aliceRank1 = screen.getByTestId('ballot-mark-opt-1-1');
      fireEvent.click(aliceRank1);

      // Wait for state update and verify selection
      await waitFor(() => {
        expect(screen.getByText('Your current ranking:')).toBeInTheDocument();
        const chips = screen.getAllByText(/Rank 1: Alice/);
        expect(chips.length).toBeGreaterThan(0);
      });

      // Switch back to drag-drop
      const dragDropTab = screen.getByRole('tab', { name: /Drag & Drop/i });
      fireEvent.click(dragDropTab);

      // Wait for the drag-drop view to render
      await waitFor(() => {
        expect(screen.getByText('Drag candidates to rank them')).toBeInTheDocument();
      });

      // Should see Alice in ranked section with Rank 1
      const rankingCard = screen.getByText('Your Ranking').parentElement.querySelector('.MuiCard-root');
      expect(within(rankingCard).getByText('Alice')).toBeInTheDocument();
      
      // Find the rank chip for Alice
      const rankChips = within(rankingCard).getAllByText(/Rank \d+/);
      expect(rankChips[0]).toHaveTextContent('Rank 1');
    });
  });
});