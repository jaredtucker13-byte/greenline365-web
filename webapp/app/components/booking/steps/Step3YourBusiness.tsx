'use client';

type Step3YourBusinessProps = {
  onBack: () => void;
  onNext: () => void;
};

export default function Step3YourBusiness({
  onBack,
  onNext,
}: Step3YourBusinessProps) {
  return (
    <div>
      <h2>Your business</h2>

      <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <label>
          Business name
          <input type="text" name="businessName" placeholder="Acme Plumbing" />
        </label>

        <label>
          Website (optional)
          <input type="url" name="website" placeholder="https://example.com" />
        </label>

        <label>
          Industry (optional)
          <input type="text" name="industry" placeholder="Home services" />
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={onBack}>
            Back
          </button>
          <button type="button" onClick={onNext}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}