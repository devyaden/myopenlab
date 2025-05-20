import Joyride, { CallBackProps, TooltipRenderProps } from 'react-joyride';
import { useState, useEffect } from 'react';
import { Button } from './ui';

const CustomJoyrideTooltip = ({
  step,
  primaryProps,
  skipProps,
  index,
  size,
  closeProps,
  tooltipProps,
  onDontShowAgainChange,
  isChecked
}: any) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <div 
        className="p-4 bg-white rounded-sm w-full" 
        {...tooltipProps}
    >
      <div className='mb-2'>{step.content}</div>

      <div className='flex justify-between items-center mt-3'>
        <label className='flex justify-start items-center text-sm select-none'>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={onDontShowAgainChange}
            style={{ marginRight: 6 }}
          />
          Don't show again
        </label>
        <Button {...primaryProps}>
          Next ({index + 1}/{size})
        </Button>
      </div>
    </div>
  );
};

export default CustomJoyrideTooltip