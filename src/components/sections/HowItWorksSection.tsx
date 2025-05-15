import React from 'react';
import { UserCircle2, Palette, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export const HowItWorksSection: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const steps = [
    {
      number: '1',
      icon: <UserCircle2 className="w-6 h-6 text-brand-400" />,
      title: 'Create Your Profile',
      description: 'Answer a few questions about your preferences, or let our AI analyze your photos.',
    },
    {
      number: '2',
      icon: <Palette className="w-6 h-6 text-accent-400" />,
      title: 'Get AI Recommendations',
      description: 'Our algorithm suggests personalized outfits and makeup looks tailored to your features.',
    },
    {
      number: '3',
      icon: <ShoppingBag className="w-6 h-6 text-brand-400" />,
      title: 'Shop or Save',
      description: 'Purchase your recommended items directly or save them to your wishlist for later.',
    },
  ];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  };
  
  return (
    <section ref={ref} className="py-24" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold gradient-text mb-4">How It Works</h2>
          <p className="text-dark-300 max-w-2xl mx-auto">
            Experience the magic of AI-powered fashion recommendations in just three simple steps.
          </p>
        </div>
        
        <motion.div 
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
        >
          {steps.map((step, index) => (
            <motion.div key={index} variants={itemVariants}>
              <StepCard 
                number={step.number}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Process visualization - decorative */}
        <div className="hidden md:flex justify-center mt-8">
          <div className="w-4/5 h-1 bg-dark-800 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-accent-500 rounded" style={{ width: inView ? '100%' : '0%', transition: 'width 1.5s ease-in-out' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface StepCardProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ number, icon, title, description }) => {
  return (
    <div className="relative text-center">
      <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold z-10">
        {number}
      </div>
      <div className="card p-8 h-full">
        <div className="w-16 h-16 mx-auto mb-6 bg-dark-800 border border-dark-700 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-dark-300">{description}</p>
      </div>
    </div>
  );
};

export default HowItWorksSection;