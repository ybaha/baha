import * as React from "react";

import { cn } from "@/lib/utils";
import { Command } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icons?: React.ReactNode[];
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icons, ...props }, ref) => {
    return (
      <div>
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {icons && (
          <div className="absolute top-1/2 transform -translate-y-1/2 right-2 flex gap-1">
            {icons?.map((icon, idx) => (
              <div
                key={idx}
                className="pointer-events-none text-foreground/60 border border-input p-0.5 rounded-md"
              >
                {icon || <Command size={14} />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
