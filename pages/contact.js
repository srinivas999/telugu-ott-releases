import { useState } from 'react';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';
import { supabase } from '../lib/supabaseClient';

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    if (typeof window !== 'undefined' && window.trackAnalyticsEvent) {
      window.trackAnalyticsEvent('submit', 'Contact Form', 'Contact page submit');
    }

    setError('');
    setIsSuccess(false);
    setIsLoading(true);

    const formData = new FormData(form);
    const full_name = formData.get('name')?.toString().trim() ?? '';
    const email = formData.get('email')?.toString().trim() ?? '';
    const phone = formData.get('phone')?.toString().trim() ?? '';
    const country = formData.get('country')?.toString().trim() ?? '';
    const comments = formData.get('comments')?.toString().trim() ?? '';

    try {
      if (!supabase) {
        throw new Error('Supabase client is unavailable.');
      }

      const { error: supabaseError } = await supabase
        .from('contact_submissions')
        .insert([
          {
            full_name,
            email,
            phone,
            country,
            comments,
            created_at: new Date().toISOString(),
          },
        ]);

      if (supabaseError) {
        throw supabaseError;
      }

      form.reset();
      setIsSuccess(true);
    } catch (err) {
      console.error('Supabase insert error:', err);
      setError(
        err.message ||
          'Sorry, we could not submit your message right now. Please try again in a moment.'
      );
    } finally {
      setIsLoading(false);
    }
  }

return (
    <Layout>
      <Seo
        title="Contact Telugu OTT Releases"
        description="Contact Telugu OTT Releases for feedback, corrections, partnership requests, and Telugu OTT movie update suggestions."
        url="/contact"
        keywords="contact Telugu OTT Releases, Telugu OTT feedback, OTT release corrections"
      />
      <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Contact Us' }]} />
      <div className="page-contact">
        {/* Decorative background elements */}
        <div className="contact-bg-blob contact-bg-blob--1" aria-hidden="true" />
        <div className="contact-bg-blob contact-bg-blob--2" aria-hidden="true" />
        <div className="contact-bg-blob contact-bg-blob--3" aria-hidden="true" />

        <div className="contact-page-inner">
          <header className="contact-page-header">
            <div className="contact-page-header__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1>Get in Touch</h1>
            <p className="contact-page-lede">
              Have questions about Telugu OTT releases, feature requests, or feedback? 
              We&apos;d love to hear from you.
            </p>
          </header>

          <div className="contact-card-wrapper">
            {!isSuccess ? (
              <form
                id="contact-form"
                className="contact-form"
                onSubmit={handleSubmit}
              >
                <div className="contact-form__grid">
                  <div className="contact-field">
                    <label htmlFor="name">
                      <span className="contact-field__icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      placeholder="John Doe"
                      required 
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="email">
                      <span className="contact-field__icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </span>
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      placeholder="john@example.com"
                      required 
                    />
                  </div>

                  <div className="contact-field contact-form__row-full">
                    <label htmlFor="phone">
                      <span className="contact-field__icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      Phone Number
                    </label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="country">
                      <span className="contact-field__icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </span>
                      Country *
                    </label>
                    <select id="country" name="country" required>
                      <option value="">Select your country</option>
                      <option value="India">India</option>
                      <option value="USA">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="contact-field contact-form__row-full">
                    <label htmlFor="comments">
                      <span className="contact-field__icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </span>
                      Message *
                    </label>
                    <textarea 
                      id="comments" 
                      name="comments" 
                      placeholder="Tell us more about your inquiry, feedback, or feature request..."
                      required
                    ></textarea>
                  </div>
                </div>
                
                <button type="submit" id="contact-submit-button" disabled={isLoading}>
                  <span className="contact-submit__text">
                    {isLoading ? 'Sending Message…' : 'Send Message'}
                  </span>
                  <svg 
                    className="contact-submit__icon" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    hidden={isLoading}
                  >
                    <path d="M22 2 11 13" />
                    <path d="m22 2-7 20-4-9-9-4 20-7z" />
                  </svg>
                  <div className="contact-submit__spinner" hidden={!isLoading}></div>
                </button>

                {error && (
                  <div id="contact-status" className="contact-status--error">
                    <span className="contact-status__icon" aria-hidden="true">⚠️</span>
                    {error}
                  </div>
                )}
              </form>
            ) : (
              <div id="contact-success" className="contact-success-card">
                <div className="contact-success__animation">
                  <div className="contact-success__circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                </div>
                <h2 className="contact-success__title">Message Sent!</h2>
                <p className="contact-success__text">
                  Thank you for reaching out. We&apos;ve received your message and will get back to you within 24-48 hours.
                </p>
                <button 
                  className="contact-success__button"
                  onClick={() => setIsSuccess(false)}
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>

          {/* Contact info cards */}
          <div className="contact-info-grid">
            <div className="contact-info-card">
              <div className="contact-info-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h3>Email Us</h3>
              <p>contact@teluguott.com</p>
            </div>
            <div className="contact-info-card">
              <div className="contact-info-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3>Response Time</h3>
              <p>Within 24-48 hours</p>
            </div>
            <div className="contact-info-card">
              <div className="contact-info-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3>Location</h3>
              <p>Hyderabad, India</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

