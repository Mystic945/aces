import { useEffect, useState } from 'react';
import { fetchListings } from '../lib/api.js';

export function useListings() {
  const [state, setState] = useState({ status: 'loading', listings: [], source: null });

  useEffect(() => {
    let cancelled = false;
    fetchListings().then(({ listings, source }) => {
      if (!cancelled) setState({ status: 'ready', listings, source });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
