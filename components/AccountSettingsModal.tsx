'use client';

import React, { useState } from 'react';
import { Wallet, X, RefreshCcw, Plus, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashBalance: number;
  startingBalance: number;
  onResetAccount: (newBalance: number) => void;
  onAdjustCash: (delta: number) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  cashBalance,
  startingBalance,
  onResetAccount,
  onAdjustCash,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number>(startingBalance);
  const [customDeposit, setCustomDeposit] = useState<string>('25000');
  const [confirmReset, setConfirmReset] = useState(false);

  const presets = [10000, 25000, 50000, 100000, 250000, 1000000];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0d0d10] border border-white/10 w-full max-w-md rounded-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0d0d10]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-bold text-xs uppercase tracking-wider text-white">Paper Account Settings</h2>
              <p className="text-[10px] text-slate-500">Manage virtual cash and simulator state</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-white hover:bg-[#16161c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Current Balance Display */}
          <div className="bg-[#16161c] p-3.5 rounded-md border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-semibold text-[10px] uppercase tracking-widest">Current Available Cash</span>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Simulated USD
            </span>
          </div>

          {/* Quick Cash Deposit */}
          <div>
            <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-semibold mb-1.5">Add Virtual Capital</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-slate-500 font-mono text-sm">$</span>
                <input
                  type="number"
                  value={customDeposit}
                  onChange={(e) => setCustomDeposit(e.target.value)}
                  className="w-full bg-[#16161c] border border-white/10 text-white rounded-md pl-7 pr-3 py-1.5 font-mono text-xs focus:outline-none focus:border-emerald-500/50"
                  placeholder="25000"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(customDeposit);
                  if (!isNaN(val) && val > 0) {
                    onAdjustCash(val);
                    onClose();
                  }
                }}
                className="px-3.5 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deposit</span>
              </button>
            </div>
          </div>

          {/* Reset Account with Presets */}
          <div className="pt-3 border-t border-white/5 space-y-3">
            <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-semibold">Reset Account Starting Balance</label>
            <div className="grid grid-cols-3 gap-1.5">
              {presets.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSelectedPreset(amount)}
                  className={`py-1.5 rounded font-mono text-xs font-semibold transition-all border ${
                    selectedPreset === amount
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold'
                      : 'bg-[#16161c] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  ${(amount / 1000).toLocaleString()}k
                </button>
              ))}
            </div>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full py-2 rounded-md bg-[#16161c] hover:bg-[#202028] text-slate-300 border border-white/10 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Account to ${selectedPreset.toLocaleString()}</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-md space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>This will clear all positions, orders, and trade history!</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="py-1.5 rounded bg-[#16161c] text-slate-400 hover:text-white border border-white/10 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetAccount(selectedPreset);
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="py-1.5 rounded bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs uppercase"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
