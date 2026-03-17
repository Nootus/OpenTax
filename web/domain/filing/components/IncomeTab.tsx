'use client';

import { useEffect } from 'react';
import SalaryTab from './SalaryTab';
import HousePropertyTab from './HousePropertyTab';
import InterestIncomeTab from './InterestIncomeTab';
import DividendIncomeTab from './DividendIncomeTab';

export default function IncomeTab() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'income-tab-no-spin-style';
    style.textContent = `
      .income-tab input[type='number']::-webkit-inner-spin-button,
      .income-tab input[type='number']::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .income-tab input[type='number'] {
        -moz-appearance: textfield;
      }
    `;
    if (!document.getElementById('income-tab-no-spin-style')) document.head.appendChild(style);
    return () => { document.getElementById('income-tab-no-spin-style')?.remove(); };
  }, []);

  return (
    <div className="income-tab space-y-4">
      <SalaryTab />
      <HousePropertyTab />
      <InterestIncomeTab />
      <DividendIncomeTab />
    </div>
  );
}
