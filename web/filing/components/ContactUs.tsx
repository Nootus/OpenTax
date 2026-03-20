import Link from 'next/link';

const TwitterIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
  </svg>
);

const YouTubeIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M23.498 6.186a2.99 2.99 0 00-2.106-2.116C19.603 3.5 12 3.5 12 3.5s-7.603 0-9.392.57A2.99 2.99 0 00.502 6.186 31.52 31.52 0 000 12a31.52 31.52 0 00.502 5.814 2.99 2.99 0 002.106 2.116C4.397 20.5 12 20.5 12 20.5s7.603 0 9.392-.57a2.99 2.99 0 002.106-2.116A31.52 31.52 0 0024 12a31.52 31.52 0 00-.502-5.814zM9.546 15.568V8.432L15.818 12l-6.272 3.568z" />
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const INDIATAX = "https://indiatax.ai";

export default function ContactUs() {
  return (
    <footer className="w-full py-16 px-6 print:hidden" style={{ background: '#000000' }}>
      <a id="contact" aria-label="contact-section" />
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
            Contact Us
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Get in Touch</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                <a href="mailto:hello@indiatax.ai" className="hover:text-white transition-colors">
                  hello@indiatax.ai
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                <a href="tel:+919908199085" className="hover:text-white transition-colors">
                  +91 99081 99085
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                <span>CIE, IIIT Hyderabad, India</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-3">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="https://github.com/nootus/OpenTax" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <GitHubIcon />
                </a>
                <a href="https://x.com/IndiaTaxAI/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <TwitterIcon />
                </a>
                <a href="https://www.linkedin.com/products/nootus-indiataxai/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <LinkedInIcon />
                </a>
                <a href="https://www.facebook.com/people/IndiaTaxAI/61582058849491/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <FacebookIcon />
                </a>
                <a href="https://www.instagram.com/indiatax.ai/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <InstagramIcon />
                </a>
                <a href="https://www.youtube.com/@IndiaTaxAI" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <YouTubeIcon />
                </a>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <a href={`${INDIATAX}/tax-planning`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Tax Planning
                </a>
              </li>
              <li>
                <a href={INDIATAX} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Tax Filing
                </a>
              </li>
              <li>
                <a href={INDIATAX} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Tax Experts
                </a>
              </li>
              <li>
                <a href={`${INDIATAX}/pricing`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* AI Tools / Calculators */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">AI Tools</h3>
            <ul className="space-y-2">
              <li>
                <a href={`${INDIATAX}/calculators/hra`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  HRA Calculator
                </a>
              </li>
              <li>
                <a href={`${INDIATAX}/calculators/capital-gains`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Capital Gains Calculator
                </a>
              </li>
              <li>
                <a href={`${INDIATAX}/calculators/salary`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Salary Calculator
                </a>
              </li>
              <li>
                <a href={`${INDIATAX}/calculators/gratuity`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Gratuity Calculator
                </a>
              </li>
              <li>
                <a href={`${INDIATAX}/calculators/ppf`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  PPF Calculator
                </a>
              </li>
              <li>
                <a href={`${INDIATAX}/calculators/home-loan-emi`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Home Loan EMI Calculator
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href={`${INDIATAX}/investors`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Investors
                </a>
              </li>
              <li>
                <a href={`${INDIATAX}/aboutus`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href={`${INDIATAX}/blog`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="https://github.com/nootus/OpenTax" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  OpenTax on GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href={`${INDIATAX}/privacy-policy`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href={`${INDIATAX}/terms-of-use`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Use
                </a>
              </li>
              <li>
                <a href="https://github.com/nootus/OpenTax/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  Apache 2.0 License
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-gray-600 pt-8 mt-8">
          <p className="text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} OpenTax by{' '}
            <a href={INDIATAX} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              IndiaTax.AI
            </a>
            . Licensed under Apache 2.0.
          </p>
        </div>
      </div>
    </footer>
  );
}
