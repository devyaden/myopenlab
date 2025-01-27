import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const InputWithIcon = React.forwardRef<
  HTMLInputElement,
  InputWithIconProps
>(
  (
    {
      label,
      error,
      icon,
      showPasswordToggle = false,
      type,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [currentType, setCurrentType] = useState(type);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
      setCurrentType(currentType === "password" ? "text" : "password");
    };

    return (
      <div className="space-y-2">
        {label && (
          <label
            className={cn(
              "block text-sm font-medium rtl:text-right",
              error ? "text-red-500" : "text-gray-700"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <Input
            ref={ref}
            type={currentType}
            className={cn(
              "w-full",
              icon && "rtl:pr-10 ltr:pl-10",
              showPasswordToggle && "ltr:pr-10 rtl:pl-10",
              error && "border-red-500 ring-1 ring-red-500",
              className
            )}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center "
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

InputWithIcon.displayName = "InputWithIcon";
