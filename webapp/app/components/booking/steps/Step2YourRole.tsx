'use client';

type Step2YourRoleProps = {
      onBack: () => void;
        onNext: () => void;
};

export default function Step2YourRole({ onBack, onNext }: Step2YourRoleProps) {
      return (
            <div>
                  <h2>Your role</h2>

                        <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
                                <label>
                                          What best describes you?
                                                    <select name="role" defaultValue="">
                                                                <option value="" disabled>
                                                                              Select one…
                                                                                          </option>
                                                                                                      <option value="owner">Owner / Founder</option>
                                                                                                                  <option value="manager">Manager</option>
                                                                                                                              <option value="admin">Admin / Assistant</option>
                                                                                                                                          <option value="other">Other</option>
                                                                                                                                                    </select>
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