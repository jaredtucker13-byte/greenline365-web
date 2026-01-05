'use client';

type Step7ConfirmationProps = {
  onBack: () => void;
    onSubmit?: () => void; // optional so it won't hard-crash if not wired yet
    };

    export default function Step7Confirmation({ onBack, onSubmit }: Step7ConfirmationProps) {
      return (
          <div>
                <h2>Confirm</h2>

                      <p>Click Finish to submit (we’ll wire saving next).</p>

                            <div style={{ display: 'flex', gap: 12 }}>
                                    <button type="button" onClick={onBack}>
                                              Back
                                                      </button>^

                                                              <button
                                                                        type="button"
                                                                                  onClick={() => {
                                                                                              if (onSubmit) onSubmit();
                                                                                                          else alert('Finish clicked — onSubmit not wired yet');
                                                                                                                    }}
                                                                                                                            >
                                                                                                                                      Finish
                                                                                                                                              </button>
                                                                                                                                                    </div>
                                                                                                                                                        </div>
                                                                                                                                                          );
                                                                                                                                                          }