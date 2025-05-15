import React from 'react';
import { Sparkles, Wand2, TrendingUp, Palette, Heart, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export const FeaturesSection: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-brand-400" />,
      title: 'Personalized AI Recommendations',
      description: 'Get outfits & makeup suggestions curated specifically for your skin tone, undertone, and body shape.',
    },
    {
      icon: <Wand2 className="w-6 h-6 text-accent-400" />,
      title: 'AI Styling Coach',
      description: 'Our AI analyzes your features to recommend styles that enhance your natural beauty.',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-brand-400" />,
      title: 'Trendy & Seasonal Styles',
      description: 'Stay ahead with fashion-forward suggestions that match current trends and seasons.',
    },
    {
      icon: <Palette className="w-6 h-6 text-accent-400" />,
      title: 'Color Analysis',
      description: 'Discover colors that complement your skin tone and make your features pop.',
    },
    {
      icon: <Heart className="w-6 h-6 text-brand-400" />,
      title: 'Save Favorites',
      description: 'Create a wishlist of your favorite items for easy reference and future shopping.',
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-accent-400" />,
      title: 'Shop Recommendations',
      description: 'Seamlessly shop recommended products from your favorite retailers.',
    },
  ];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };
  
  return (
    <section ref={ref} className="py-24 bg-dark-900" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold gradient-text mb-4">Cutting-Edge Features</h2>
          <p className="text-dark-300 max-w-2xl mx-auto">
            Our AI-powered platform offers a suite of innovative features to help you discover your perfect style.
          </p>
        </div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <FeatureCard 
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <Card variant="hover" className="h-full">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center mb-5">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-dark-300">{description}</p>
      </CardContent>
    </Card>
  );
};

export default FeaturesSection;