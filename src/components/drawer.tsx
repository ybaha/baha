import { Drawer } from "vaul";
import { CommandIcon } from "lucide-react";

import { MenuContent } from "@/components/menu-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function MobileDrawer() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <Drawer.Root
      shouldScaleBackground
      open={isDrawerOpen}
      onOpenChange={(val) => setDrawerOpen(val)}
      snapPoints={[1]}
    >
      <Button variant="ghost" title="Toggle drawer" asChild>
        <Drawer.Trigger>
          <CommandIcon size={16} />
        </Drawer.Trigger>
      </Button>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-foreground/10" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 mt-24 flex h-[80vh] flex-col rounded-t-lg bg-background/80">
          <div className="flex-1 overflow-y-auto rounded-t-[10px] bg-background p-4">
            <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-primary/70" />
            <MenuContent setDrawerOpen={setDrawerOpen} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
