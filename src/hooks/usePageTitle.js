import { useEffect } from 'react';

const BASE_TITLE = 'Better Choices for Ohio';

export const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
    return () => { document.title = BASE_TITLE; };
  }, [title]);
};
