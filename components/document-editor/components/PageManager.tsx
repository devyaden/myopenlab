"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { useDocumentStore } from "@/lib/store/useDocument";

export type Page = {
  id: string;
  title: string;
  content: string | null;
  pageSize: PageSize;
};

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

type PageAction =
  | { type: "ADD_PAGE"; payload: { afterIndex: number } }
  | { type: "REMOVE_PAGE"; payload: { index: number } }
  | { type: "SET_CURRENT_PAGE"; payload: { index: number } }
  | { type: "UPDATE_PAGE_TITLE"; payload: { index: number; title: string } }
  | { type: "UPDATE_PAGE_CONTENT"; payload: { index: number; content: string } }
  | { type: "UPDATE_PAGE_SIZE"; payload: { index: number; pageSize: PageSize } }
  | { type: "SET_PAGE_CONTENT_LOADED"; payload: { loaded: boolean } }
  | { type: "SET_PAGES"; payload: { pages: Page[] } }; // Added SET_PAGES action

type PageState = {
  pages: Page[];
  currentPageIndex: number;
  isPageContentLoaded: boolean;
  isDeletingPage: boolean;
};

function pageReducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case "ADD_PAGE": {
      const { afterIndex } = action.payload;
      const newPageId = `page-${Date.now()}`;
      const newPage = {
        id: newPageId,
        title: `Page ${state.pages.length + 1}`,
        content: null,
        pageSize: PAGE_SIZES.A4,
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
      if (state.pages.length <= 1) return state;
      const newPages = state.pages.filter((_, i) => i !== index);
      let newCurrentIndex = state.currentPageIndex;
      if (index === state.currentPageIndex) {
        newCurrentIndex = index === 0 ? 0 : index - 1;
      } else if (index < state.currentPageIndex) {
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
      if (state.isDeletingPage || index < 0 || index >= state.pages.length)
        return state;
      return { ...state, currentPageIndex: index, isPageContentLoaded: false };
    }
    case "UPDATE_PAGE_TITLE": {
      const { index, title } = action.payload;
      if (index < 0 || index >= state.pages.length) return state;
      const newPages = [...state.pages];
      newPages[index] = { ...newPages[index], title };
      return { ...state, pages: newPages };
    }
    case "UPDATE_PAGE_CONTENT": {
      const { index, content } = action.payload;
      if (state.isDeletingPage || index < 0 || index >= state.pages.length)
        return state;
      const newPages = [...state.pages];
      newPages[index] = { ...newPages[index], content };
      return { ...state, pages: newPages };
    }
    case "UPDATE_PAGE_SIZE": {
      const { index, pageSize } = action.payload;
      if (state.isDeletingPage || index < 0 || index >= state.pages.length)
        return state;
      const newPages = [...state.pages];
      newPages[index] = { ...newPages[index], pageSize };
      return { ...state, pages: newPages };
    }
    case "SET_PAGE_CONTENT_LOADED": {
      const { loaded } = action.payload;
      return {
        ...state,
        isPageContentLoaded: loaded,
        isDeletingPage: loaded ? false : state.isDeletingPage,
      };
    }
    case "SET_PAGES": {
      const { pages } = action.payload;
      return {
        ...state,
        pages,
        currentPageIndex: 0,
        isPageContentLoaded: false,
      };
    }
    default:
      return state;
  }
}

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
  setPages: (pages: Page[]) => void; // Added setPages
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
  const initialState: PageState = {
    pages: [
      { id: "page-1", title: "Page 1", content: null, pageSize: PAGE_SIZES.A4 },
    ],
    currentPageIndex: 0,
    isPageContentLoaded: true,
    isDeletingPage: false,
  };

  const [state, dispatch] = useReducer(pageReducer, initialState);
  const { pages, currentPageIndex, isPageContentLoaded } = state;

  const addPage = useCallback(() => {
    dispatch({ type: "ADD_PAGE", payload: { afterIndex: currentPageIndex } });
  }, [currentPageIndex]);

  const removePage = useCallback((index: number) => {
    dispatch({ type: "REMOVE_PAGE", payload: { index } });
  }, []);

  const setCurrentPage = useCallback((index: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: { index } });
  }, []);

  const updatePageTitle = useCallback((index: number, title: string) => {
    dispatch({ type: "UPDATE_PAGE_TITLE", payload: { index, title } });
  }, []);

  const updatePageContent = useCallback((index: number, content: string) => {
    dispatch({ type: "UPDATE_PAGE_CONTENT", payload: { index, content } });
  }, []);

  const updatePageSize = useCallback((index: number, pageSize: PageSize) => {
    dispatch({ type: "UPDATE_PAGE_SIZE", payload: { index, pageSize } });
  }, []);

  const setPages = useCallback((pages: Page[]) => {
    dispatch({ type: "SET_PAGES", payload: { pages } });
  }, []);

  const getCurrentPageSize = useCallback((): PageSize => {
    return currentPageIndex >= 0 && currentPageIndex < pages.length
      ? pages[currentPageIndex].pageSize || PAGE_SIZES.A4
      : PAGE_SIZES.A4;
  }, [currentPageIndex, pages]);

  const getCurrentPageContent = useCallback((): string | null => {
    return currentPageIndex >= 0 && currentPageIndex < pages.length
      ? pages[currentPageIndex].content
      : null;
  }, [currentPageIndex, pages]);

  useEffect(() => {
    if (!isPageContentLoaded) {
      const timeoutId = setTimeout(() => {
        dispatch({
          type: "SET_PAGE_CONTENT_LOADED",
          payload: { loaded: true },
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isPageContentLoaded]);

  // Sync pages with document store
  const { updateEditorState } = useDocumentStore();
  useEffect(() => {
    updateEditorState(JSON.stringify({ pages }));
  }, [pages, updateEditorState]);

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
        setPages,
      }}
    >
      {children}
    </PageContext.Provider>
  );
}
