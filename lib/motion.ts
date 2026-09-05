export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: EASE } 
  },
};

export const staggerContainer = (stagger = 0.08) => ({
  hidden: {},
  visible: { 
    transition: { staggerChildren: stagger } 
  },
});
