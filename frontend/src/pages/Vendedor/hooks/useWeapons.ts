import { useState } from 'react';
import type { Weapon } from '../types';

export const useWeapons = () => {
  const [weapons, setWeapons] = useState<Weapon[]>([
    {
      id: '1',
      modelo: 'Modelo A',
      calibre: '55',
      capacidad: 12,
      precio: 1000,
      imagen: '/weapon1.png',
      disponible: true
    },
    {
      id: '2',
      modelo: 'Modelo B',
      calibre: '45',
      capacidad: 15,
      precio: 1200,
      imagen: '/weapon2.png',
      disponible: true
    }
  ]);

  return {
    weapons,
    setWeapons
  };
}; 