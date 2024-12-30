import { Loader } from "lucide-react";

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[60vh]">
      <Loader className="h-6 w-6 animate-spin text-foreground/80" />
    </div>
  );
};
