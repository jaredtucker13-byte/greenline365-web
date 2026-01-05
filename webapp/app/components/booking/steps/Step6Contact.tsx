'use client';

type Step6ContactProps = {
      onBack: () => void;
        onNext: () => void;
};

export default function Step6Contact({ onBack, onNext }: Step6ContactProps) {
      return (
            <div>
                  <h2>Contact info</h2>

                        <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
                                <label>
                                          Full name
                                                    <input type="text" name="contactName" placeholder="Jane Doe" />
                                                            </label>

                                                                    <label>
                                                                              Email
                                                                                        <input type="email" name="email" placeholder="jane@company.com" required />
                                                                                                </label>

                                                                                                        <label>
                                                                                                                  Phone (optional)
                                                                                                                            <input type="tel" name="phone" placeholder="(555) 555-5555" />
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
      