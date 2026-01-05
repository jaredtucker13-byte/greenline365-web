'use client';

type Step1YourDetailsProps = {
      onNext: () => void;
};

export default function Step1YourDetails({ onNext }: Step1YourDetailsProps) {
      return (
            <div>
                  <h2>Your details</h2>

                        <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
                                <label>
                                          Full name
                                                    <input type="text" name="fullName" placeholder="Jane Doe" />
                                                            </label>

                                                                    <label>
                                                                              Company (optional)
                                                                                        <input type="text" name="company" placeholder="GreenLine365" />
                                                                                                </label>

                                                                                                        <button type="button" onClick={onNext}>
                                                                                                                  Next
                                                                                                                          </button>
                                                                                                                                </div>
                                                                                                                                    </div>
      );
}
      