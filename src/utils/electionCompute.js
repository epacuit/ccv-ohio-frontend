// Client-side IRV + head-to-head computation from a ranked CSV.
// Uses "extended strict preference": unranked candidates are considered tied last.

/**
 * Parse a ranked-choice CSV into rankings+counts.
 * Expected format: first column = Count, remaining columns = candidate names.
 * Cells contain rank numbers (1 = most preferred), blanks = unranked.
 *
 * @param {string} text - CSV contents
 * @returns {{ candidates: string[], rankings: Array<Object>, rcounts: number[] }}
 */
export const parseRankingsCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error('CSV appears to be empty.');

  const header = lines[0].split(',').map((s) => s.trim());
  if (header.length < 2 || header[0].toLowerCase() !== 'count') {
    throw new Error('First column must be "Count". Columns after that are candidate names.');
  }
  const candidates = header.slice(1).filter((c) => c.length > 0);

  const rankings = [];
  const rcounts = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((s) => s.trim());
    const count = parseInt(cells[0], 10);
    if (!Number.isFinite(count) || count <= 0) continue;
    const rmap = {};
    for (let j = 0; j < candidates.length; j++) {
      const v = cells[j + 1];
      if (v && v.length > 0) {
        const r = parseInt(v, 10);
        if (Number.isFinite(r) && r > 0) rmap[candidates[j]] = r;
      }
    }
    if (Object.keys(rmap).length > 0) {
      rankings.push(rmap);
      rcounts.push(count);
    }
  }

  if (rankings.length === 0) throw new Error('No valid ballots found.');
  return { candidates, rankings, rcounts };
};

// ----------------------------------------------------------------
// IRV — replay with fractional vote splitting for ties at top
// ----------------------------------------------------------------
const firstChoiceAmong = (ranking, remainingSet) => {
  let minRank = Infinity;
  const tops = [];
  for (const c in ranking) {
    if (!remainingSet.has(c)) continue;
    const r = ranking[c];
    if (r < minRank) {
      minRank = r;
      tops.length = 0;
      tops.push(c);
    } else if (r === minRank) {
      tops.push(c);
    }
  }
  return tops.length ? tops : null;
};

const computeIrv = (rankings, rcounts, candidates) => {
  const remaining = [...candidates];
  const rounds = [];
  const transfers = [];
  let roundNum = 1;

  while (remaining.length > 1) {
    const remainingSet = new Set(remaining);
    const tally = {};
    remaining.forEach((c) => { tally[c] = 0; });
    for (let i = 0; i < rankings.length; i++) {
      const top = firstChoiceAmong(rankings[i], remainingSet);
      if (!top) continue;
      const share = rcounts[i] / top.length;
      for (const t of top) tally[t] += share;
    }
    rounds.push({
      round: roundNum,
      tallies: { ...tally },
      remaining: [...remaining],
    });

    // Majority check — if any candidate has > 50%, stop early
    const totalThisRound = Object.values(tally).reduce((s, v) => s + v, 0);
    const hasMajority = Object.values(tally).some((v) => v > totalThisRound / 2);
    if (hasMajority && remaining.length === 2) break;

    // Find eliminated candidate (smallest tally; tie-break alphabetically)
    const minVotes = Math.min(...Object.values(tally));
    const elimCandidates = Object.keys(tally).filter((c) => tally[c] === minVotes).sort();
    const elim = elimCandidates[0];

    const nextRemainingSet = new Set(remaining.filter((c) => c !== elim));
    const transfer = {};
    remaining.forEach((c) => { if (c !== elim) transfer[c] = 0; });
    let exhausted = 0;

    for (let i = 0; i < rankings.length; i++) {
      const top = firstChoiceAmong(rankings[i], remainingSet);
      if (!top || !top.includes(elim)) continue;
      const share = rcounts[i] / top.length;
      const nextTop = firstChoiceAmong(rankings[i], nextRemainingSet);
      if (!nextTop) {
        exhausted += share;
      } else {
        const per = share / nextTop.length;
        for (const t of nextTop) transfer[t] += per;
      }
    }

    transfers.push({ eliminated: elim, transfers: transfer, exhausted });
    remaining.splice(remaining.indexOf(elim), 1);
    roundNum += 1;
  }

  // Final tally (winner standing alone, or last round with two candidates if majority)
  if (remaining.length >= 1) {
    const remainingSet = new Set(remaining);
    const tally = {};
    remaining.forEach((c) => { tally[c] = 0; });
    for (let i = 0; i < rankings.length; i++) {
      const top = firstChoiceAmong(rankings[i], remainingSet);
      if (!top) continue;
      const share = rcounts[i] / top.length;
      for (const t of top) tally[t] += share;
    }
    // Only append if last recorded round has a different remaining set
    const last = rounds[rounds.length - 1];
    if (!last || last.remaining.length !== remaining.length) {
      rounds.push({ round: roundNum, tallies: tally, remaining: [...remaining] });
    }
  }

  // Winner = candidate with highest final tally
  const finalTallies = rounds[rounds.length - 1].tallies;
  let rcvWinner = null;
  let best = -1;
  for (const c in finalTallies) {
    if (finalTallies[c] > best) {
      best = finalTallies[c];
      rcvWinner = c;
    }
  }

  return { rounds, transfers, rcv_winner: rcvWinner };
};

// ----------------------------------------------------------------
// Head-to-head with extended strict preference
// (unranked candidates are considered tied last)
// ----------------------------------------------------------------
const computeH2H = (rankings, rcounts, candidates) => {
  const h2h = {};
  for (const a of candidates) {
    h2h[a] = {};
    for (const b of candidates) {
      if (a === b) continue;
      h2h[a][b] = { prefers: 0, opponent_prefers: 0, margin: 0 };
    }
  }

  for (let i = 0; i < rankings.length; i++) {
    const r = rankings[i];
    const cnt = rcounts[i];
    for (let x = 0; x < candidates.length; x++) {
      const a = candidates[x];
      for (let y = x + 1; y < candidates.length; y++) {
        const b = candidates[y];
        const ra = a in r ? r[a] : Infinity;
        const rb = b in r ? r[b] : Infinity;
        if (ra === Infinity && rb === Infinity) continue; // both unranked = tied last
        if (ra < rb) {
          h2h[a][b].prefers += cnt;
          h2h[b][a].opponent_prefers += cnt;
        } else if (rb < ra) {
          h2h[b][a].prefers += cnt;
          h2h[a][b].opponent_prefers += cnt;
        }
      }
    }
  }

  for (const a of candidates) {
    for (const b of candidates) {
      if (a === b) continue;
      h2h[a][b].margin = h2h[a][b].prefers - h2h[a][b].opponent_prefers;
    }
  }

  // Condorcet winner = candidate who beats everyone head-to-head
  let condorcetWinner = null;
  for (const a of candidates) {
    let wins = true;
    for (const b of candidates) {
      if (a === b) continue;
      if (h2h[a][b].margin <= 0) { wins = false; break; }
    }
    if (wins) { condorcetWinner = a; break; }
  }

  return { h2h, condorcet_winner: condorcetWinner };
};

/**
 * Compute the full comparison dataset from parsed rankings.
 * @returns Same shape as src/data/alaska2022.json
 */
export const computeComparisonData = ({ candidates, rankings, rcounts }, electionName = 'Uploaded Election') => {
  const total_ballots = rcounts.reduce((s, v) => s + v, 0);
  const { h2h, condorcet_winner } = computeH2H(rankings, rcounts, candidates);
  const { rounds, transfers, rcv_winner } = computeIrv(rankings, rcounts, candidates);

  return {
    election: electionName,
    candidates,
    total_ballots,
    h2h,
    condorcet_winner,
    rcv_winner,
    rounds,
    transfers,
  };
};
