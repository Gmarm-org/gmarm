import React from 'react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose: _onClose,
  children,
  maxWidth = "max-w-4xl",
  maxHeight = "max-h-[90vh]"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 ${maxWidth} w-full mx-4 ${maxHeight} overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
};

export default BaseModal;
