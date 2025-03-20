"use client";

import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES, usePageManager } from "../../components/PageManager";

export default function PageNavigationPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const {
    pages,
    currentPageIndex,
    addPage,
    removePage,
    setCurrentPage,
    updatePageTitle,
    updatePageSize,
    getCurrentPageSize,
  } = usePageManager();

  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [pages]);

  const [pageTitle, setPageTitle] = useState(
    pages[currentPageIndex]?.title || ""
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPageSize, setCurrentPageSize] =
    useState<(typeof PAGE_SIZES)[keyof typeof PAGE_SIZES]>(
      getCurrentPageSize()
    );

  useEffect(() => {
    setPageTitle(pages[currentPageIndex]?.title || "");
    setCurrentPageSize(getCurrentPageSize());
  }, [currentPageIndex, pages, getCurrentPageSize]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setPageTitle(newTitle);
    updatePageTitle(currentPageIndex, newTitle);
  };

  const handlePageSizeChange = (value: string) => {
    const newSize =
      Object.values(PAGE_SIZES).find((size) => size.name === value) ||
      PAGE_SIZES.A4;
    setCurrentPageSize(newSize);
    updatePageSize(currentPageIndex, newSize);
  };

  const isLastPage = currentPageIndex >= pages.length - 1;
  const isFirstPage = currentPageIndex <= 0;

  const handleDeletePage = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    removePage(currentPageIndex);
    setTimeout(() => forceUpdate({}), 50);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-100 border-t border-gray-300 shadow-md p-2 flex justify-between items-center text-sm z-50">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={pageTitle}
          onChange={handleTitleChange}
          placeholder="Title"
          className="px-2 py-1 border rounded text-xs w-[150px]"
        />
        <Select
          value={currentPageSize.name}
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="w-[100px] text-xs px-2 py-1">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(PAGE_SIZES).map((size) => (
              <SelectItem key={size.name} value={size.name}>
                {size.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => !isFirstPage && setCurrentPage(currentPageIndex - 1)}
          disabled={isFirstPage}
          className={`px-2 py-1 border rounded text-xs ${
            isFirstPage ? "bg-gray-200 cursor-not-allowed" : "bg-gray-300"
          }`}
        >
          Prev
        </button>
        <span className="text-xs">
          {currentPageIndex + 1} / {pages.length}
        </span>
        <button
          onClick={() => !isLastPage && setCurrentPage(currentPageIndex + 1)}
          disabled={isLastPage}
          className={`px-2 py-1 border rounded text-xs ${
            isLastPage ? "bg-gray-200 cursor-not-allowed" : "bg-gray-300"
          }`}
        >
          Next
        </button>
        <button
          onClick={addPage}
          className="px-2 py-1 bg-green-500 text-white text-xs rounded"
        >
          +
        </button>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <button
              onClick={handleDeletePage}
              disabled={pages.length <= 1}
              className={`px-2 py-1 text-xs rounded ${
                pages.length <= 1
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-red-500 text-white"
              }`}
            >
              🗑
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Page</DialogTitle>
              <DialogDescription>
                Are you sure? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
