// hooks/usePoll.js
import { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { POLL_SLUGS } from '../constants/pollMappings';

export const usePoll = (urlParam) => {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  
  const pollingInterval = useRef(null);
  
  const pollId = POLL_SLUGS[urlParam] || urlParam;

  const loadPoll = async () => {
    try {
      const response = await API.get(`/polls/${pollId}`);
      const pollData = response.data;
      
      // Ensure each candidate has a unique ID
      if (pollData.candidates) {
        pollData.candidates = pollData.candidates.map((candidate, index) => {
          if (typeof candidate === 'string') {
            return {
              id: `candidate-${index}`,
              name: candidate
            };
          }
          return {
            ...candidate,
            id: candidate.id || `candidate-${index}` // Add ID if missing
          };
        });
      }
      
      setPoll(pollData);
      setNotFound(false);
      setError('');
      
      if (loading) {
        setLoading(false);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError('Failed to load poll. Please check the link and try again.');
      }
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPoll();
  }, [pollId]);

  // Set up polling for write-ins
  useEffect(() => {
    if (poll?.settings?.allow_write_in) {
      pollingInterval.current = setInterval(() => {
        loadPoll();
      }, 3000);
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [poll?.settings?.allow_write_in]);

  return {
    poll,
    pollId,
    loading,
    error,
    notFound,
    refetch: loadPoll,
  };
};