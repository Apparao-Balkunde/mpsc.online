import React from 'react';

const AboutUs = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">About Us - MPSC सारथी</h1>
      
      <section className="mb-8">
        <p className="text-lg mb-4">
          नमस्कार! <strong>MPSC सारथी (MPSC Sarathi)</strong> मध्ये आपले स्वागत आहे. 
          हे एक समर्पित शैक्षणिक प्लॅटफॉर्म आहे जे महाराष्ट्रातील स्पर्धा परीक्षांची (MPSC) तयारी करणाऱ्या विद्यार्थ्यांना अचूक आणि दर्जेदार मार्गदर्शन पुरवण्यासाठी तयार करण्यात आले आहे.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm border-l-4 border-blue-600">
          <h2 className="text-xl font-bold text-blue-700 mb-2">आमचे ध्येय (Our Mission)</h2>
          <p>दुर्गम भागातील आणि गरजू विद्यार्थ्यांना स्पर्धा परीक्षेसाठी आवश्यक असलेले दर्जेदार स्टडी मटेरियल, PYQ विश्लेषण आणि चालू घडामोडी मोफत किंवा अत्यंत अल्प दरात उपलब्ध करून देणे.</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-sm border-l-4 border-green-600">
          <h2 className="text-xl font-bold text-green-700 mb-2">आम्ही काय देतो?</h2>
          <ul className="list-disc list-inside">
            <li>MPSC PYQ Analysis</li>
            <li>Daily Current Affairs</li>
            <li>Subject-wise Study Notes</li>
            <li>Exam Updates & Strategy</li>
          </ul>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">आम्ही कोण आहोत?</h2>
        <p className="mb-4">
          आम्ही स्पर्धा परीक्षेचा अनुभव असलेले मार्गदर्शक आणि तंत्रज्ञांची (Tech Enthusiasts) एक टीम आहोत. 
          ग्रामीण भागातील विद्यार्थ्यांना शहरात येऊन लाखो रुपये खर्च करणे शक्य नसते, हे ओळखून आम्ही डिजिटल माध्यमाद्वारे त्यांना मदत करत आहोत.
        </p>
      </section>

      <section className="bg-gray-100 p-6 rounded-xl text-center">
        <h2 className="text-2xl font-semibold mb-2">आमच्याशी संपर्क साधा</h2>
        <p className="mb-4">तुम्हाला काही शंका असल्यास किंवा सहकार्यासाठी तुम्ही आम्हाला खालील ईमेलवर संपर्क साधू शकता:</p>
        <p className="text-blue-700 font-bold text-xl underline">support@mpscsarathi.online</p>
      </section>

      <footer className="mt-12 text-center text-gray-500 text-sm italic">
        "विद्यार्थ्यांच्या यशातच आमचे यश आहे!"
      </footer>
    </div>
  );
};

export default AboutUs;

