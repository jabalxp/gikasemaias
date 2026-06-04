import React from 'react';
import { motion } from 'framer-motion';

/**
 * Wrapper de transição de página com fade/slide sutil.
 *
 * Use uma `key` distinta por tela (ex.: o nome da tela atual) para que o
 * framer-motion reanime a entrada sempre que o conteúdo trocar.
 */
export function PageTransition({ children }: React.PropsWithChildren): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
