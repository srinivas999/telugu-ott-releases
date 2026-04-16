import Layout from '../components/Layout';
import Seo from '../components/Seo';
import ContactForm from '../components/ContactForm';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Srinivas',
  description: 'Contact Srinivas for UX, OTT product, and web design collaboration.',
  url: 'https://svteluguott.in/contact',
};

export default function ContactPage() {
  return (
    <Layout>
      <Seo
        title="Contact"
        description="Contact Srinivas for UX, OTT product, and web design collaboration."
        url="/contact"
        keywords="Contact Srinivas, UX designer, project inquiry, OTT release schedule"
        jsonLd={jsonLd}
      />
      <ContactForm />
    </Layout>
  );
}
