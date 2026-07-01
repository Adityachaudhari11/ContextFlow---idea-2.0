import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12">
      <div className="max-w-3xl mx-auto w-full bg-white p-8 md:p-12 shadow-sm rounded-2xl border border-gray-100">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
          <Shield className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
        </div>

        <div className="prose prose-sm md:prose-base prose-gray max-w-none space-y-6">
          <p className="text-gray-600">
            <strong>Effective Date:</strong> July 1, 2026
          </p>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to ContextFlow. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our website 
              or use our services, and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Data We Collect</h2>
            <p className="text-gray-600 leading-relaxed">
              We may collect, use, store and transfer different kinds of personal data about you, including:
            </p>
            <ul className="list-disc pl-5 text-gray-600 mt-2 space-y-1">
              <li><strong>Identity Data:</strong> First name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> Email address, phone number, and physical address.</li>
              <li><strong>Technical Data:</strong> IP address, browser type and version, time zone setting, and operating system.</li>
              <li><strong>Usage Data:</strong> Information about how you use our website, products, and services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. How We Use Your Data</h2>
            <p className="text-gray-600 leading-relaxed">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-5 text-gray-600 mt-2 space-y-1">
              <li>To provide, operate, and maintain our services.</li>
              <li>To improve, personalize, and expand our services.</li>
              <li>To communicate with you, either directly or through one of our partners, including for customer service.</li>
              <li>To process your transactions.</li>
              <li>For compliance with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Third-Party Integrations</h2>
            <p className="text-gray-600 leading-relaxed">
              Our service integrates with third-party platforms such as Meta (WhatsApp, Instagram), Telegram, and Google (Gmail). 
              When you connect these services, we only process the data necessary to provide our unified inbox and automation services. 
              We do not sell your data to any third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, 
              or accessed in an unauthorized way, altered, or disclosed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
              <br />
              <strong>Email:</strong> contextflow.business@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
