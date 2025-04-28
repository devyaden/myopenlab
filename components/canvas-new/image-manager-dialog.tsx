import { useState, useEffect } from "react";
import { Trash2, Upload, Plus, Search, CheckCircle2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ImageManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    id: string;
    src: string;
    alt: string;
    createdAt?: string;
  }>;
  onImageDelete: (imageId: string) => void;
  onImageUpload: () => void;
  onImageSelect: (image: { id: string; src: string; alt: string }) => void;
}

export function ImageManagerDialog({
  isOpen,
  onClose,
  images,
  onImageDelete,
  onImageUpload,
  onImageSelect,
}: ImageManagerDialogProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Reset selection when dialog opens or images change
  useEffect(() => {
    if (isOpen) {
      setSelectedImageId(null);
      setSearchQuery(""); // Reset search query when dialog opens
    }
  }, [isOpen, images]);

  // Improved filtering to search in both alt text and id for better matching
  const filteredImages = images.filter((image) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Search in the alt text (image name)
    return image.alt.toLowerCase().includes(query);
  });

  const sortedImages = [...filteredImages].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  const recentImages = sortedImages.slice(0, 6);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col p-0 border-yadn-primary-gray">
        <DialogHeader className="p-6 pb-2 bg-yadn-secondary-gray flex-shrink-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-yadn-primary-text">
              Image Library
            </DialogTitle>
            <div className="text-sm text-yadn-dark-gray">
              {images.length} image{images.length !== 1 ? "s" : ""} available
              <span className="ml-1 text-yadn-dark-gray">(maximum: 10)</span>
            </div>
          </div>
          <DialogDescription className="text-yadn-dark-gray">
            Manage your images and insert them into your canvas. You can upload
            a maximum of 10 images.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2 bg-yadn-secondary-gray border-b border-yadn-primary-gray flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-yadn-primary-text">
              Image slots used: {images.length}/10
            </div>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  images.length >= 8
                    ? "bg-yadn-primary-red"
                    : images.length >= 5
                      ? "bg-yadn-accent-blue"
                      : "bg-yadn-primary-green"
                }`}
                style={{ width: `${(images.length / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-b border-yadn-primary-gray flex-shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-yadn-dark-gray" />
            <Input
              placeholder="Search images..."
              className="pl-8 border-yadn-primary-gray focus-visible:ring-yadn-accent-blue"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div
            className="relative"
            title={
              images.length >= 10
                ? "You have reached the maximum limit of 10 images"
                : ""
            }
          >
            <Button
              onClick={onImageUpload}
              className="flex items-center gap-1 bg-yadn-accent-green hover:bg-yadn-accent-green/80"
              disabled={images.length >= 10}
            >
              <Plus className="w-4 h-4" />
              <span>Upload New</span>
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue="all"
          className="flex-1 flex flex-col min-h-0"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="px-6 border-b border-yadn-primary-gray bg-white flex-shrink-0">
            <TabsList className="w-auto h-11 bg-transparent">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-yadn-accent-blue/20 data-[state=active]:text-yadn-accent-blue data-[state=active]:shadow-none"
              >
                All Images
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className="data-[state=active]:bg-yadn-accent-blue/20 data-[state=active]:text-yadn-accent-blue data-[state=active]:shadow-none"
              >
                Recent
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="all"
            className="flex-1 overflow-y-auto p-6 pt-4 bg-white h-[300px]"
          >
            {sortedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-yadn-dark-gray text-center">
                {searchQuery ? (
                  <>
                    <Search className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-base mb-2">
                      No images match your search
                    </p>
                    <p className="text-sm text-yadn-dark-gray">
                      Try a different search term
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-base mb-4">
                      Your image library is empty
                    </p>
                    <Button
                      onClick={onImageUpload}
                      className="bg-yadn-button-blue hover:bg-yadn-accent-dark-blue"
                    >
                      Upload your first image
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sortedImages.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    isSelected={selectedImageId === image.id}
                    onSelect={() => setSelectedImageId(image.id)}
                    onDelete={onImageDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="recent"
            className="flex-1 overflow-y-auto p-6 pt-4 bg-white h-[300px]"
          >
            {recentImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-yadn-dark-gray text-center">
                <Upload className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-base mb-4">No recent images</p>
                <Button
                  onClick={onImageUpload}
                  className="bg-yadn-button-blue hover:bg-yadn-accent-dark-blue"
                >
                  Upload an image
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {recentImages.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    isSelected={selectedImageId === image.id}
                    onSelect={() => setSelectedImageId(image.id)}
                    onDelete={onImageDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between p-4 border-t border-yadn-primary-gray mt-auto bg-yadn-secondary-gray flex-shrink-0">
          <div className="flex items-center">
            {selectedImageId && (
              <div className="text-sm text-yadn-primary-text">
                <span className="font-medium">Selected:</span>{" "}
                {images.find((img) => img.id === selectedImageId)?.alt ||
                  "Image"}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-yadn-dark-gray text-yadn-primary-text hover:bg-yadn-primary-gray"
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedImageId}
              onClick={() => {
                const selectedImage = images.find(
                  (img) => img.id === selectedImageId
                );
                if (selectedImage) {
                  onImageSelect(selectedImage);
                  onClose();
                }
              }}
              className="bg-yadn-accent-green hover:bg-yadn-accent-green/80"
            >
              Insert Selected Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ImageCardProps {
  image: {
    id: string;
    src: string;
    alt: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
}

function ImageCard({ image, isSelected, onSelect, onDelete }: ImageCardProps) {
  return (
    <div
      className={cn(
        "group relative border rounded-md overflow-hidden transition-all cursor-pointer",
        isSelected
          ? "ring-2 ring-yadn-accent-blue border-transparent"
          : "hover:shadow-md border-yadn-primary-gray"
      )}
      onClick={onSelect}
    >
      <div className="aspect-square flex items-center justify-center bg-yadn-secondary-gray">
        <img
          src={image.src}
          alt={image.alt}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2 bg-yadn-accent-blue rounded-full p-0.5">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-8 px-3 pb-2">
        <div className="text-white text-xs font-medium truncate">
          {image.alt}
        </div>
      </div>

      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ display: isSelected ? "none" : "block" }}
      >
        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7 rounded-full bg-yadn-primary-red"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
