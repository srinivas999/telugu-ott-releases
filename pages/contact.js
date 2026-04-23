import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function ContactPage() {
  const router = useRouter();
  const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <Layout>
      <div className="page-contact">
        <div className="contact-page-inner">
          <header className="contact-page-header">
            <h1>Contact Us</h1>
            <p className="contact-page-lede">
              Have questions about Telugu OTT releases, feature requests, or feedback? 
              We'd love to hear from you. Fill out the form below and we'll get back to you soon.
            </p>
          </header>

          <div className="contact-main">
            <form id="contact-form" className="contact-form">
              <div className="contact-form__grid">
                <div>
                  <label htmlFor="name">Full Name *</label>
                  <input type="text" id="name" name="name" required />
                </div>
                <div>
                  <label htmlFor="email">Email Address *</label>
                  <input type="email" id="email" name="email" required />
                </div>
                <div className="contact-form__row-full">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" />
                </div>
                <div>
                  <label htmlFor="country">Country *</label>
                  <select id="country" name="country" required>
                    <option value="">Select Country</option>
                    <option value="India">India</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="contact-form__row-full">
                  <label htmlFor="comments">Comments / Message *</label>
                  <textarea 
                    id="comments" 
                    name="comments" 
                    placeholder="Tell us more about your inquiry..."
                    required
                  ></textarea>
                </div>
              </div>
              
              <button type="submit" id="contact-submit-button">
                <span className="contact-submit__text">Send Message</span>
                <div className="contact-submit__spinner" hidden></div>
              </button>
            </form>

            <div id="contact-success" hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              <div>Thank you!</div>
              <p>Your message has been sent successfully. We'll get back to you within 24-48 hours.</p>
            </div>

            <div id="contact-status" hidden></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

