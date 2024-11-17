export const animatePoints = (startValue, endValue, duration, onUpdate) => {
  const startTime = performance.now();
  const difference = endValue - startValue;

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    
    const currentValue = Math.floor(startValue + difference * easeOutQuart);
    onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}; 