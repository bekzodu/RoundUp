export const generateBlocks = () => {
  // This is a simple example - modify according to your needs
  return Array(10).fill(null).map((_, index) => ({
    id: index,
    content: `Block ${index + 1}`,
    correct: Math.random() > 0.5 // Randomly determine if block is correct
  }));
}; 