import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Github } from 'lucide-react';
import { APP_VERSION } from '../../lib/utils';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-900 border-t border-dark-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-5 lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold">
                Z
              </div>
              <span className="text-xl font-bold gradient-text">ProjectZ</span>
            </div>
            <p className="text-dark-300 mb-4 max-w-md">
              AI-powered fashion and beauty recommendations tailored to your unique features and preferences.
            </p>
            <div className="flex space-x-4">
              <SocialLink href="#" icon={<Facebook className="w-5 h-5" />} label="Facebook" />
              <SocialLink href="#" icon={<Twitter className="w-5 h-5" />} label="Twitter" />
              <SocialLink href="#" icon={<Instagram className="w-5 h-5" />} label="Instagram" />
              <SocialLink href="#" icon={<Github className="w-5 h-5" />} label="GitHub" />
            </div>
          </div>
          
          <div className="md:col-span-7 lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold text-white mb-4">Company</h3>
                <ul className="space-y-2">
                  <FooterLink href="#">About Us</FooterLink>
                  <FooterLink href="#">Careers</FooterLink>
                  <FooterLink href="#">Blog</FooterLink>
                  <FooterLink href="#">Press</FooterLink>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-2">
                  <FooterLink href="#">Privacy Policy</FooterLink>
                  <FooterLink href="#">Terms of Service</FooterLink>
                  <FooterLink href="#">Cookies</FooterLink>
                  <FooterLink href="#">GDPR</FooterLink>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Support</h3>
                <ul className="space-y-2">
                  <FooterLink href="#">Help Center</FooterLink>
                  <FooterLink href="#">Contact Us</FooterLink>
                  <FooterLink href="#">FAQ</FooterLink>
                  <FooterLink href="#">Status</FooterLink>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-dark-800 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-dark-400 text-sm">
            &copy; {new Date().getFullYear()} ProjectZ. All rights reserved.
          </p>
          <p className="text-dark-500 text-xs mt-2 sm:mt-0">
            Version {APP_VERSION} | Made with ❤️ for fashion enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
};

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const SocialLink: React.FC<SocialLinkProps> = ({ href, icon, label }) => {
  return (
    <a
      href={href}
      className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
      aria-label={label}
    >
      {icon}
    </a>
  );
};

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

const FooterLink: React.FC<FooterLinkProps> = ({ href, children }) => {
  return (
    <li>
      <a href={href} className="text-dark-300 hover:text-white transition-colors">
        {children}
      </a>
    </li>
  );
};

export default Footer;