'use client';

type Step5DateTimeProps = {
      onBack: () => void;
        onNext: () => void;
};

export default function Step5DateTime({ onBack, onNext }: Step5DateTimeProps) {
      return (
            <div>
                  <h2>Pick a date & time</h2>

                        <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
                                <label>
                                          Preferred date/time
                                                    <input type="datetime-local" name="preferredDateTime" />
                                                            </label>

                                                                    <label>
                                                                              Alternate date/time (optional)
                                                                                        <input type="datetime-local" name="alternateDateTime" />
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
      )
}
}