"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";

// Update the Page type to include pageSize
export type Page = {
  id: string;
  title: string;
  content: string | null;
  pageSize: PageSize;
};

// Add PageSize type and constants
export type PageSize = {
  name: string;
  width: string;
  height: string;
};

export const PAGE_SIZES = {
  A4: { name: "A4", width: "210mm", height: "297mm" },
  LETTER: { name: "Letter", width: "215.9mm", height: "279.4mm" },
  LEGAL: { name: "Legal", width: "215.9mm", height: "355.6mm" },
  A3: { name: "A3", width: "297mm", height: "420mm" },
  A5: { name: "A5", width: "148mm", height: "210mm" },
};

// Update PageAction to include UPDATE_PAGE_SIZE
type PageAction =
  | { type: "ADD_PAGE"; payload: { afterIndex: number } }
  | { type: "REMOVE_PAGE"; payload: { index: number } }
  | { type: "SET_CURRENT_PAGE"; payload: { index: number } }
  | { type: "UPDATE_PAGE_TITLE"; payload: { index: number; title: string } }
  | { type: "UPDATE_PAGE_CONTENT"; payload: { index: number; content: string } }
  | { type: "UPDATE_PAGE_SIZE"; payload: { index: number; pageSize: PageSize } }
  | { type: "SET_PAGE_CONTENT_LOADED"; payload: { loaded: boolean } };

// Define state type
type PageState = {
  pages: Page[];
  currentPageIndex: number;
  isPageContentLoaded: boolean;
  isDeletingPage: boolean;
};

// Reducer function to handle all state updates
function pageReducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case "ADD_PAGE": {
      const { afterIndex } = action.payload;
      const newPageId = `page-${Date.now()}`;
      const newPage = {
        id: newPageId,
        title: `Page ${state.pages.length + 1}`,
        content: null,
        pageSize: PAGE_SIZES.A4, // Default to A4
      };

      const newPages = [...state.pages];
      newPages.splice(afterIndex + 1, 0, newPage);

      return {
        ...state,
        pages: newPages,
        currentPageIndex: afterIndex + 1,
        isPageContentLoaded: false,
      };
    }

    case "REMOVE_PAGE": {
      const { index } = action.payload;

      if (state.pages.length <= 1) {
        return state; // Don't remove the last page
      }

      // Create a new array without the page at the specified index
      const newPages = state.pages.filter((_, i) => i !== index);

      // Calculate new current page index
      let newCurrentIndex = state.currentPageIndex;
      if (index === state.currentPageIndex) {
        // If we're removing the current page, move to the previous page
        // unless we're at the first page, then move to the next page (which will be index 0)
        newCurrentIndex = index === 0 ? 0 : index - 1;
      } else if (index < state.currentPageIndex) {
        // If we're removing a page before the current page, adjust the index
        newCurrentIndex = state.currentPageIndex - 1;
      }

      return {
        ...state,
        pages: newPages,
        currentPageIndex: newCurrentIndex,
        isPageContentLoaded: false,
        isDeletingPage: true,
      };
    }

    case "SET_CURRENT_PAGE": {
      const { index } = action.payload;

      if (state.isDeletingPage || index < 0 || index >= state.pages.length) {
        return state;
      }

      return {
        ...state,
        currentPageIndex: index,
        isPageContentLoaded: false,
      };
    }

    case "UPDATE_PAGE_TITLE": {
      const { index, title } = action.payload;

      if (index < 0 || index >= state.pages.length) {
        return state;
      }

      const newPages = [...state.pages];
      newPages[index] = { ...newPages[index], title };

      return {
        ...state,
        pages: newPages,
      };
    }

    case "UPDATE_PAGE_CONTENT": {
      const { index, content } = action.payload;

      if (state.isDeletingPage || index < 0 || index >= state.pages.length) {
        return state;
      }

      const newPages = [...state.pages];
      newPages[index] = { ...newPages[index], content };

      return {
        ...state,
        pages: newPages,
      };
    }

    case "UPDATE_PAGE_SIZE": {
      const { index, pageSize } = action.payload;

      if (state.isDeletingPage || index < 0 || index >= state.pages.length) {
        return state;
      }

      const newPages = [...state.pages];
      newPages[index] = { ...newPages[index], pageSize };

      return {
        ...state,
        pages: newPages,
      };
    }

    case "SET_PAGE_CONTENT_LOADED": {
      const { loaded } = action.payload;

      return {
        ...state,
        isPageContentLoaded: loaded,
        isDeletingPage: loaded ? false : state.isDeletingPage,
      };
    }

    default:
      return state;
  }
}

// Update the PageContextType to include updatePageSize
type PageContextType = {
  pages: Page[];
  currentPageIndex: number;
  addPage: () => void;
  removePage: (index: number) => void;
  setCurrentPage: (index: number) => void;
  updatePageTitle: (index: number, title: string) => void;
  updatePageContent: (index: number, content: string) => void;
  updatePageSize: (index: number, pageSize: PageSize) => void;
  getCurrentPageContent: () => string | null;
  getCurrentPageSize: () => PageSize;
  isPageContentLoaded: boolean;
};

const PageContext = createContext<PageContextType | null>(null);

export function usePageManager() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePageManager must be used within a PageManagerProvider");
  }
  return context;
}

type PageManagerProviderProps = {
  children: ReactNode;
};

export function PageManagerProvider({ children }: PageManagerProviderProps) {
  // Initial state
  const initialState: PageState = {
    pages: [
      { id: "page-1", title: "Page 1", content: null, pageSize: PAGE_SIZES.A4 },
    ],
    currentPageIndex: 0,
    isPageContentLoaded: true,
    isDeletingPage: false,
  };

  // Use reducer for state management
  const [state, dispatch] = useReducer(pageReducer, initialState);
  const { pages, currentPageIndex, isPageContentLoaded } = state;

  // Create a new page after the current page
  const addPage = useCallback(() => {
    dispatch({
      type: "ADD_PAGE",
      payload: { afterIndex: currentPageIndex },
    });
  }, [currentPageIndex]);

  const removePage = useCallback((index: number) => {
    dispatch({
      type: "REMOVE_PAGE",
      payload: { index },
    });
  }, []);

  const setCurrentPage = useCallback((index: number) => {
    dispatch({
      type: "SET_CURRENT_PAGE",
      payload: { index },
    });
  }, []);

  const updatePageTitle = useCallback((index: number, title: string) => {
    dispatch({
      type: "UPDATE_PAGE_TITLE",
      payload: { index, title },
    });
  }, []);

  const updatePageContent = useCallback((index: number, content: string) => {
    dispatch({
      type: "UPDATE_PAGE_CONTENT",
      payload: { index, content },
    });
  }, []);

  // Add the updatePageSize function to the provider
  const updatePageSize = useCallback((index: number, pageSize: PageSize) => {
    dispatch({
      type: "UPDATE_PAGE_SIZE",
      payload: { index, pageSize },
    });
  }, []);

  // Add getCurrentPageSize function
  const getCurrentPageSize = useCallback((): PageSize => {
    if (currentPageIndex >= 0 && currentPageIndex < pages.length) {
      return pages[currentPageIndex].pageSize || PAGE_SIZES.A4;
    }
    return PAGE_SIZES.A4;
  }, [currentPageIndex, pages]);

  const getCurrentPageContent = useCallback((): string | null => {
    if (currentPageIndex >= 0 && currentPageIndex < pages.length) {
      return pages[currentPageIndex].content;
    }
    return null;
  }, [currentPageIndex, pages]);

  // When page content is loaded into the editor, mark it as loaded
  useEffect(() => {
    if (!isPageContentLoaded) {
      // Use a timeout to allow the editor to properly load content
      const timeoutId = setTimeout(() => {
        dispatch({
          type: "SET_PAGE_CONTENT_LOADED",
          payload: { loaded: true },
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isPageContentLoaded]);

  // Update the context provider value to include the new functions
  return (
    <PageContext.Provider
      value={{
        pages,
        currentPageIndex,
        addPage,
        removePage,
        setCurrentPage,
        updatePageTitle,
        updatePageContent,
        updatePageSize,
        getCurrentPageContent,
        getCurrentPageSize,
        isPageContentLoaded,
      }}
    >
      {children}
    </PageContext.Provider>
  );
}
