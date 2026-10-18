import React from 'react';

interface StarterPackModalProps {
 isOpen: boolean;
 onClose: () => void;
 language: string;
 onPurchased?: () => void;
}

export const StarterPackModal: React.FC<StarterPackModalProps> = () => {
 return null;
};

export default StarterPackModal;
