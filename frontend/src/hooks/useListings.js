import { useCallback, useEffect, useState } from 'react';
import { fetchListings } from '../lib/api.js';

/**
 * Loads the listings once. `source` is "api" or "bundled"; `origin` is what
 * the API says it read them from ("mongodb" or "file"). `addListing` puts a
 * borrower who has just applied into the list without a reload.
 */
export function useListings() {
  const [state, setState] = useState({
    status: 'loading',
    listings: [],
    source: null,
    origin: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetchListings().then(({ listings, source, origin = null }) => {
      if (!cancelled) setState({ status: 'ready', listings, source, origin });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const addListing = useCallback((listing) => {
    setState((current) => ({
      ...current,
      listings: [...current.listings.filter((l) => l.id !== listing.id), listing],
    }));
  }, []);

  return { ...state, addListing };
}
