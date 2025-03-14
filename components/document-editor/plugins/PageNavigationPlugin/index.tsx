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

  // Force re-render when pages change
  const [, forceUpdate] = useState({});

  // Update component when pages change
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

  // Update the title input and page size when the current page changes
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

  // Calculate if we're on the last page
  const isLastPage = currentPageIndex >= pages.length - 1;
  // Calculate if we're on the first page
  const isFirstPage = currentPageIndex <= 0;

  // Handle page deletion with confirmation
  const handleDeletePage = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    console.log(`Deleting page at index ${currentPageIndex}`);
    removePage(currentPageIndex);
    // Force update after deletion
    setTimeout(() => forceUpdate({}), 50);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div
      className="page-navigation"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <div
        className="page-title-and-size"
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        <input
          type="text"
          value={pageTitle}
          onChange={handleTitleChange}
          placeholder="Page Title"
          style={{
            padding: "5px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            width: "200px",
          }}
        />

        <Select
          value={currentPageSize.name}
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Page Size" />
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

      <div
        className="page-controls"
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        <button
          onClick={() => !isFirstPage && setCurrentPage(currentPageIndex - 1)}
          disabled={isFirstPage}
          style={{
            padding: "5px 10px",
            backgroundColor: isFirstPage ? "#e0e0e0" : "#f0f0f0",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isFirstPage ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>

        <span style={{ margin: "0 10px" }}>
          Page {currentPageIndex + 1} of {pages.length}
        </span>

        <button
          onClick={() => !isLastPage && setCurrentPage(currentPageIndex + 1)}
          disabled={isLastPage}
          style={{
            padding: "5px 10px",
            backgroundColor: isLastPage ? "#e0e0e0" : "#f0f0f0",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: isLastPage ? "not-allowed" : "pointer",
          }}
        >
          Next
        </button>

        <button
          onClick={addPage}
          style={{
            padding: "5px 10px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            marginLeft: "10px",
            cursor: "pointer",
          }}
        >
          Add Page
        </button>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <button
              onClick={handleDeletePage}
              disabled={pages.length <= 1}
              style={{
                padding: "5px 10px",
                backgroundColor: pages.length <= 1 ? "#e0e0e0" : "#f44336",
                color: pages.length <= 1 ? "#999" : "white",
                border: "none",
                borderRadius: "4px",
                cursor: pages.length <= 1 ? "not-allowed" : "pointer",
              }}
            >
              Delete Page
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Page</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this page? This action cannot be
                undone.
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
