'use client';

type Step4WhatYouNeedProps = {
      onBack: () => void;
      onNext: () => void;
};

export default function Step4WhatYouNeed({
      onBack,
        onNext,
}: Step4WhatYouNeedProps) {
      return (
            <div>
                  <h2>What do you need?</h2>

                        <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
                                <fieldset style={{ display: 'grid', gap: 8 }}>
                                          <legend>Select all that apply</legend>

                                                    <label>
                                                                <input type="checkbox" name="needs" value="new-site" /> New website
                                                                          </label>

                                                                                    <label>
                                                                                                <input type="checkbox" name="needs" value="redesign" /> Redesign / refresh
                                                                                                          </label>

                                                                                                                    <label>
                                                                                                                                <input type="checkbox" name="needs" value="seo" /> SEO help
                                                                                                                                          </label>

                                                                                                                                                    <label>
                                                                                                                                                                <input type="checkbox" name="needs" value="ads" /> Google/Facebook ads
                                                                                                                                                                          </label>

                                                                                                                                                                                    <label>
                                                                                                                                                                                                <input type="checkbox" name="needs" value="automation" /> Automation / AI
                                                                                                                                                                                                          </label>
                                                                                                                                                                                                                  </fieldset>

                                                                                                                                                                                                                          <label>
                                                                                                                                                                                                                                    Notes (optional)
                                                                                                                                                                                                                                              <textarea
                                                                                                                                                                                                                                                          name="notes"
                                                                                                                                                                                                                                                                      rows={4}
                                                                                                                                                                                                                                                                                  placeholder="Tell us what you're trying to accomplish…"
                                                                                                                                                                                                                                                                                            />
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
