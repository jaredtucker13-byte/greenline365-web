'use client';
import React, { createContext, useContext, useState } from 'react';

type FormData = { name?: string; email?: string; [key: string]: any };
type BookingContextValue = {
  formData: FormData;
  updateFormData: (patch: Partial<FormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  step: number;
};

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<FormData>({});
  const [step, setStep] = useState(1);
  
  const updateFormData = (patch: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };
  
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => Math.max(1, prev - 1));
  
  return (
    <BookingContext.Provider value={{ formData, updateFormData, nextStep, prevStep, step }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
}
