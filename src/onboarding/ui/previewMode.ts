import { createContext } from 'react';

/** Dev preview only (`full=1`): screens render at their full content height instead of scrolling, so a screenshot can capture the whole document. */
export const FullHeightContext = createContext(false);
