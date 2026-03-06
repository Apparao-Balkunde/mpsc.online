import React from 'react';

const LegalPages = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Privacy Policy & Disclaimer</h1>
      <p className="mb-4 text-sm text-gray-500">Last Updated: March 06, 2026</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 border-b-2 border-blue-100 pb-1">1. Disclaimer</h2>
        <p className="mb-4">
          All the information on this website – <strong>https://mpscsarathi.online</strong> – is published in good faith and for general information purpose only. MPSC Sarathi does not make any warranties about the completeness, reliability and accuracy of this information.
        </p>
        <div className="bg-yellow-50 p-4 border-l-4 border-yellow-400 italic mb-4">
          <strong>Note:</strong> MPSC Sarathi is an independent educational platform and is <strong>NOT</strong> affiliated with the Maharashtra Public Service Commission (MPSC) or any government entity.
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 border-b-2 border-blue-100 pb-1">2. Privacy Policy</h2>
        <p className="mb-4">
          At MPSC Sarathi, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by MPSC Sarathi and how we use it.
        </p>
        
        <h3 className="text-xl font-medium mt-4 mb-2">Log Files</h3>
        <p className="mb-4">
          We follow a standard procedure of using log files. These files log visitors when they visit websites. This includes IP addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.
        </p>

        <h3 className="text-xl font-medium mt-4 mb-2">Google DoubleClick DART Cookie</h3>
        <p className="mb-4">
          Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 border-b-2 border-blue-100 pb-1">3. Contact Us</h2>
        <p>
          If you have any questions about our Privacy Policy or Disclaimer, please contact us at:
          <br />
          <span className="text-blue-600 font-bold">Email: support@mpscsarathi.online</span>
        </p>
      </section>
    </div>
  );
};

export default LegalPages;

