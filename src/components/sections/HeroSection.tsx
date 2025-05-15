import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Wand2, Palette } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden noise">
        <div className="absolute w-full h-full bg-dark-950"></div>
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-brand-500/10 filter blur-[100px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-accent-500/10 filter blur-[100px]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center px-4 py-2 bg-dark-800/50 border border-dark-700 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4 text-brand-400 mr-2" />
              <span>AI-Powered Fashion & Beauty Recommendations</span>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 gradient-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Your Personal AI Stylist <br className="hidden sm:block" />
            Tailored Just for You
          </motion.h1>
          
          <motion.p 
            className="text-xl text-dark-300 mb-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Discover AI-powered outfit and makeup recommendations that match your style, skin tone, and body shape — personalized styling that's always on-point.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button 
              variant="primary" 
              size="lg"
              rightIcon={<ArrowRight className="w-5 h-5" />}
              as={Link} 
              to="/auth"
              className="py-4 sm:px-10"
            >
              Get Started for Free
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              as="a" 
              href="#how-it-works"
              className="py-4"
            >
              Learn How It Works
            </Button>
          </motion.div>
          
          <motion.div 
            className="mt-16 grid sm:grid-cols-3 gap-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <StatCard
              icon={<Sparkles className="w-5 h-5 text-brand-400" />}
              title="AI Analysis"
              description="Our AI analyzes your features to find perfect matches"
            />
            <StatCard
              icon={<Wand2 className="w-5 h-5 text-accent-400" />}
              title="Personalized"
              description="Recommendations tailored to your unique characteristics"
            />
            <StatCard
              icon={<Palette className="w-5 h-5 text-brand-400" />}
              title="Fashion & Makeup"
              description="From outfit ideas to makeup that complements your look"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-dark-300 text-sm">{description}</p>
    </div>
  );
};

export default HeroSection;