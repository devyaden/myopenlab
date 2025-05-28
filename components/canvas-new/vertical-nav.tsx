'use client'
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import { CANVAS_TYPE } from "@/types/store";
import { Image, Printer, Shapes } from "lucide-react";
import { useEffect, useState } from "react";
import Joyride from 'react-joyride';
import CustomJoyrideTooltip from "../CustomJoyrideTooltip";
import { useUser } from "@/lib/contexts/userContext";
import { useMemo } from "react";

interface VerticalNavProps {
  className?: string;
  onToggleSidebar: () => void;
  canvasType: CANVAS_TYPE | null;
  onDragStart?: (event: React.DragEvent, shapeType: string) => void;
  onOpenImageManager?: () => void;
}

export function VerticalNav({
  className,
  onToggleSidebar,
  canvasType,
  onDragStart,
  onOpenImageManager,
}: VerticalNavProps) {
  const { isFirstVisit, canvasOnbording, setIsChecked, isChecked } = useOnboardingStore();
  const [isWindow, setIsWindow] = useState(false)

  const { user } = useUser();

  const steps = [
    {
      target: '.canvas-shapes',
      content: 'You can draw multiple shapes by clicking here. Great for building diagrams and visual elements.',
      disableBeacon: true,
    },
    {
      target: '.images-library',
      content: 'Click here to upload and manage images in your project. Useful for enhancing visuals.',
      disableBeacon: true,
    },
  ];

  const handleDontShowAgainChange = (e: any) => {
    setIsChecked(e.target?.checked)
  }

  const isHasSeenOnborading = useMemo(() => {
    if (!user?.has_seen_onboarding) {
      return !user?.has_seen_onboarding && canvasOnbording
    } else {
      return user?.has_seen_onboarding && canvasOnbording
    }
  }, [user?.has_seen_onboarding, canvasOnbording])

  useEffect(()=>{
    setIsWindow(true)
  },[])

  return (
    <>
      {isHasSeenOnborading && isWindow && isFirstVisit && <Joyride
        steps={steps}
        tooltipComponent={(props: any) => (
          <CustomJoyrideTooltip
              {...props} 
              onDontShowAgainChange={handleDontShowAgainChange}
              isChecked={isChecked}
            />
          )}
        continuous
        showProgress
        showSkipButton
        styles={{
          options: {
            primaryColor: '#22c55e',
            zIndex: 10000,
          },
        }}
      />}
      <div
        className={`w-[72px] border-r border-gray-200 flex flex-col items-center py-4 gap-2 ${className} z-30 bg-white`}
      >
        {canvasType === CANVAS_TYPE.HYBRID && (
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-lg hover:bg-gray-100 border-yadn-accent-green canvas-shapes"
            onClick={onToggleSidebar}
          >
            <Shapes className="!h-6 !w-6 text-yadn-accent-green" />
          </Button>
        )}
        {/* <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-lg hover:bg-gray-100"
        >
          <Printer className="!h-6 !w-6" />
        </Button> */}

        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-lg hover:bg-gray-100 cursor-move images-library"
          draggable
          onDragStart={(e) => onDragStart && onDragStart(e, "image")}
          onClick={onOpenImageManager}
        >
          <Image className="!h-6 !w-6" />
        </Button>
      </div>
    </>
  );
}
