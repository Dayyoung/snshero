import React from 'react';
import { Copy } from 'lucide-react';

interface QuickDeckCloneButtonProps {
  onClone?: () => void;
  className?: string;
}

export const QuickDeckCloneButton: React.FC<QuickDeckCloneButtonProps> = ({
  onClone,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onClone}
      className={`px-2.5 py-1 text-xs border border-[#201d1d]/20 rounded-sm font-bold flex items-center gap-1 hover:bg-[#201d1d]/5 cursor-pointer ${className}`}
    >
      <Copy size={13} />
      <span>덱 복제</span>
    </button>
  );
};

export default QuickDeckCloneButton;
