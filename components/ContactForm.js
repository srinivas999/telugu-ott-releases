import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'contact_submissions';

export default function ContactForm() {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');

  const disabled = status === 'loading';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'loading') return;

    if (!supabase) {
      setFeedback('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      setStatus('error');
      return;
    }

    const { name, email, subject, message } = formState;
    if (!name || !email || !subject || !message) {
      setFeedback('Please fill in all fields before submitting.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setFeedback('');

    try {
      const { error } = await supabase.from(TABLE_NAME).insert([
        {
          full_name: name,
          email,
          subject,
          message,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        throw error;
      }

      setStatus('success');
      setFeedback('Thanks for reaching out. Your message has been sent.');
      setFormState({ name: '', email: '', subject: '', message: '' });
    } catch (submissionError) {
      console.error('Contact submission failed:', submissionError);
      setStatus('error');
      setFeedback('Sorry, we could not submit your message right now. Please try again later.');
    }
  };

  return (
    <div className="contact-page-inner">
      <header className="contact-page-header">
        <h1>Contact</h1>
        <p className="contact-page-lede">
          Have a project in mind, want to collaborate, or just want to say hello? Send a message—I typically reply within a few business days.
        </p>
      </header>

      <div className="contact-layout">
        <div className="contact-form-column">
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-field">
              <label className="contact-label" htmlFor="contact-name">Full Name</label>
              <input
                className="contact-input"
                id="contact-name"
                name="name"
                type="text"
                placeholder="Your name"
                value={formState.name}
                onChange={handleChange}
                required
                disabled={disabled}
              />
            </div>

            <div className="contact-field">
              <label className="contact-label" htmlFor="contact-email">Email Address</label>
              <input
                className="contact-input"
                id="contact-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formState.email}
                onChange={handleChange}
                required
                disabled={disabled}
              />
            </div>

            <div className="contact-field">
              <label className="contact-label" htmlFor="contact-subject">Subject</label>
              <select
                className="contact-select"
                id="contact-subject"
                name="subject"
                value={formState.subject}
                onChange={handleChange}
                required
                disabled={disabled}
              >
                <option value="">Select a subject</option>
                <option value="project-enquiry">Project Enquiry</option>
                <option value="collaboration">Collaboration</option>
                <option value="just-saying-hi">Just Saying Hi</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="contact-field">
              <label className="contact-label" htmlFor="contact-message">Message</label>
              <textarea
                className="contact-textarea"
                id="contact-message"
                name="message"
                placeholder="Tell me a bit about what you’re looking for…"
                rows="6"
                value={formState.message}
                onChange={handleChange}
                required
                disabled={disabled}
              />
            </div>

            <button type="submit" className="contact-submit" disabled={disabled}>
              <span className="contact-submit__text">{status === 'loading' ? 'Submitting…' : 'Submit'}</span>
              <span className="contact-submit__spinner" hidden={status !== 'loading'} aria-hidden="true" />
            </button>
          </form>

          {feedback ? (
            <div
              className={`contact-status ${status === 'error' ? 'contact-status--error' : ''}`}
              role="status"
              aria-live="polite"
            >
              {feedback}
            </div>
          ) : null}
        </div>

        <aside className="contact-aside" aria-labelledby="contact-aside-heading">
          <h2 id="contact-aside-heading" className="contact-aside__title">Details</h2>
          <dl className="contact-aside__list">
            <div className="contact-aside__row">
              <dt className="contact-aside__dt">Location</dt>
              <dd className="contact-aside__dd">Hyderabad, India</dd>
            </div>
            <div className="contact-aside__row">
              <dt className="contact-aside__dt">Email</dt>
              <dd className="contact-aside__dd">
                <a className="contact-aside__link" href="mailto:villasrinivas9@gmail.com">villasrinivas9@gmail.com</a>
              </dd>
            </div>
            <div className="contact-aside__row">
              <dt className="contact-aside__dt">LinkedIn</dt>
              <dd className="contact-aside__dd">
                <a
                  className="contact-aside__link"
                  href="https://www.linkedin.com/in/srinivas-villa-30222560/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn profile
                </a>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
