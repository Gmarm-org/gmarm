import { useState, useCallback } from 'react';

export type ModalMode = 'create' | 'edit' | 'view';

interface ModalState<T> {
  isOpen: boolean;
  mode: ModalMode;
  selectedItem: T | null;
  openCreate: () => void;
  openEdit: (item: T) => void;
  openView: (item: T) => void;
  close: () => void;
}

export function useModalState<T>(): ModalState<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>('view');
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const openCreate = useCallback(() => {
    setSelectedItem(null);
    setMode('create');
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setSelectedItem(item);
    setMode('edit');
    setIsOpen(true);
  }, []);

  const openView = useCallback((item: T) => {
    setSelectedItem(item);
    setMode('view');
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedItem(null);
    setMode('view');
  }, []);

  return { isOpen, mode, selectedItem, openCreate, openEdit, openView, close };
}
