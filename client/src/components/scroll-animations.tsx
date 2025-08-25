import { useEffect, useRef, useState } from 'react';

interface ScrollAnimationProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  animationType?: 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'rotate';
}

export const ScrollAnimation = ({ 
  children, 
  delay = 0, 
  className = '',
  animationType = 'fade'
}: ScrollAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-1000 ease-out';
    
    switch (animationType) {
      case 'fade':
        return `${baseClasses} ${isVisible ? 'opacity-100' : 'opacity-0'}`;
      case 'slide-up':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;
      case 'slide-left':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`;
      case 'slide-right':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`;
      case 'scale':
        return `${baseClasses} ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`;
      case 'rotate':
        return `${baseClasses} ${isVisible ? 'opacity-100 rotate-0' : 'opacity-0 rotate-3'}`;
      default:
        return `${baseClasses} ${isVisible ? 'opacity-100' : 'opacity-0'}`;
    }
  };

  return (
    <div 
      ref={elementRef} 
      className={`${getAnimationClasses()} ${className}`}
    >
      {children}
    </div>
  );
};

export default ScrollAnimation;