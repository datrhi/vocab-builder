import React from 'react';

interface PasswordStrengthIndicatorProps {
  score: number | undefined; // zxcvbn score (0-4)
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ score }) => {
  const totalBars = 4; // Display 4 bars for scores 1-4

  const getColor = (index: number): string => {
    if (score === undefined || score < 1) {
      // Show red for score 0 or undefined, only if it's the first bar
      return index === 0 ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-600';
    }
    if (index < score) {
      // Color based on overall score
      switch (score) {
        case 1: return 'bg-red-500'; // Weak
        case 2: return 'bg-yellow-500'; // Fair
        case 3: return 'bg-green-500'; // Good
        case 4: return 'bg-green-500'; // Strong
        default: return 'bg-gray-200 dark:bg-gray-600';
      }
    }
    return 'bg-gray-200 dark:bg-gray-600'; // Unfilled bars
  };

  const getStrengthText = (currentScore: number | undefined) => {
    switch (currentScore) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  return (
    <div className="mt-2">
      <div className="flex space-x-1 h-1.5 rounded-full overflow-hidden">
        {Array.from({ length: totalBars }).map((_, index) => (
          <div
            key={index}
            className={`flex-1 ${getColor(index)} transition-colors duration-300 ease-in-out`}
            style={{ transitionProperty: 'background-color' }} // Ensure smooth transition
          />
        ))}
      </div>
      <p className={`mt-1 text-xs ${score === 0 || score === 1 ? 'text-red-500' : score === 2 ? 'text-yellow-500' : score === 3 || score === 4 ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
        {getStrengthText(score)}
      </p>
    </div>
  );
};

export default PasswordStrengthIndicator;