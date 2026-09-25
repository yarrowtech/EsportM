// components/layout/Header.tsx
import React from 'react';
import { NeoButton } from '../ui/NeoButton';
import { NeoCard } from '../ui/NeoCard';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  return (
    <NeoCard className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8" padding="p-4 sm:px-8 sm:py-5">
      <h1 className="text-2xl font-bold text-[#3B405D] mb-4 sm:mb-0">{title}</h1>
      <div className="flex gap-4 w-full sm:w-auto">
        <NeoButton className="px-8 rounded-full text-sm font-semibold">Log out</NeoButton>
        <NeoButton className="px-8 rounded-full text-sm font-semibold">Home</NeoButton>
      </div>
    </NeoCard>
  );
};