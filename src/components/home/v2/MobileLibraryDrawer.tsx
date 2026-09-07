'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import LibraryPanelInner from './LibraryPanelInner';

interface MobileLibraryDrawerProps {
  open: boolean;
  onClose: () => void;
}

const drawerSpring = { type: 'spring' as const, stiffness: 380, damping: 38, mass: 0.8 };

export default function MobileLibraryDrawer({ open, onClose }: MobileLibraryDrawerProps) {
  const pathname = usePathname();

  // Close when the user navigates anywhere
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="me-backdrop"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />

          {/* Drawer panel */}
          <motion.div
            key="me-drawer"
            className="fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[85vw] bg-[#0b0b0b] border-l border-white/[0.04] overflow-hidden md:hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={drawerSpring}
          >
            <LibraryPanelInner forceLibrary onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
