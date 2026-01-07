'use client';

import { useState } from 'react';
import { createBooking } from '@/lib/supabase/client';
import StepIndicator from './booking/StepIndicator';
import Step1YourDetails from './booking/steps/Step1YourDetails';
import Step2YourRole from './booking/steps/Step2YourRole';
import Step3YourBusiness from './booking/steps/Step3YourBusiness';
import Step4WhatYouNeed from './booking/steps/Step4WhatYouNeed';
import Step5Time from './booking/steps/Step5Time';
import Step6Contact from './booking/steps/Step6Contact';
import Step7Confirmation from './booking/steps/Step7Confirmation';

interface BookingFormData {
  fullName?: string;
  company?: string;
  role?: string;
  businessName?: string;
  website?: string;
  industry?: string;
  needs?: string[];
  notes?: string;
  preferredDateTime?: string;
  alternateDateTime?: string;
  contactName?: string;
  email?: string;
  phone?: string;
}

export default function MultiStepBookingForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>({});
  const totalSteps = 7;

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    try {
      await createBooking({
        full_name: formData.fullName || formData.contactName || '',
        company: formData.company,
        role: formData.role,
        business_name: formData.businessName,
        website: formData.website,
        industry: formData.industry,
        needs: formData.needs,
        notes: formData.notes,
        preferred_datetime: formData.preferredDateTime || '',
        alternate_datetime: formData.alternateDateTime,
        email: formData.email || '',
        phone: formData.phone,
        source: 'greenline365-main',
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  };

  return (
    <div className="w-full">
      <StepIndicator currentStep={step} totalSteps={totalSteps} />

      {step === 1 && (
        <Step1YourDetails
          onNext={nextStep}
          data={formData}
          onUpdate={updateFormData}
        />
      )}
      {step === 2 && (
        <Step2YourRole
          onBack={prevStep}
          onNext={nextStep}
          data={formData}
          onUpdate={updateFormData}
        />
      )}
      {step === 3 && (
        <Step3YourBusiness
          onBack={prevStep}
          onNext={nextStep}
          data={formData}
          onUpdate={updateFormData}
        />
      )}
      {step === 4 && (
        <Step4WhatYouNeed
          onBack={prevStep}
          onNext={nextStep}
          data={formData}
          onUpdate={updateFormData}
        />
      )}
      {step === 5 && (
        <Step5Time
          onBack={prevStep}
          onNext={nextStep}
          data={formData}
          onUpdate={updateFormData}
        />
      )}
      {step === 6 && (
        <Step6Contact
          onBack={prevStep}
          onNext={nextStep}
          data={formData}
          onUpdate={updateFormData}
        />
      )}
      {step === 7 && (
        <Step7Confirmation
          onBack={prevStep}
          onSubmit={handleSubmit}
          data={formData}
        />
      )}
    </div>
  );
}
