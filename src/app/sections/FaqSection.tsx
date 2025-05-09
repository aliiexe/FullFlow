'use client'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShinyButton } from '@/components/magicui/shiny-button';

type FaqItem = {
  question: string;
  answer: string;
};

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqItems: FaqItem[] = [
    {
      question: "How does your service work?",
      answer: "Our service operates on a subscription basis. Once you sign up, you'll get immediate access to our platform where you can manage your projects, access resources, and utilize our full suite of tools. We handle all the technical aspects, so you can focus on growing your business."
    },
    {
      question: "What makes Full Flow different from competitors?",
      answer: "Full Flow combines intuitive design with powerful functionality. Unlike our competitors, we provide a seamless experience with real-time analytics, AI-powered insights, and dedicated support. Our platform is built to scale with your business, ensuring you never outgrow our capabilities."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Absolutely! We believe in the quality of our service, not in locking customers into contracts. You can cancel your subscription at any time directly from your account dashboard. If you cancel, you'll still have access until the end of your current billing period."
    },
    {
      question: "Do you offer discounts for annual payments?",
      answer: "Yes, we offer a 20% discount for annual subscriptions compared to the monthly payment option. This offers significant savings while providing you with uninterrupted access to our full range of features and priority support."
    },
    {
      question: "Is there a free trial available?",
      answer: "We offer a 14-day free trial with no credit card required. This gives you full access to explore our platform and see the value it brings to your workflow before making a decision. If you decide to continue, you can easily upgrade to one of our paid plans."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer comprehensive support through multiple channels. Our customer service team is available via live chat during business hours, and you can submit support tickets 24/7. Premium plans include priority response times and dedicated account managers for personalized assistance."
    },
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 px-6 relative overflow-hidden">
      
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-20">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p 
            className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            Find answers to common questions about our services, pricing, and support options.
          </motion.p>
        </div>
        
        {/* FAQ items - fixed width container */}
        <div className="grid gap-4 md:gap-6 max-w-3xl mx-auto">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflowWrap: 'break-word' }}
              className="w-full max-w-2xl"
            >
              <div 
                className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl overflow-hidden w-full"
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="flex justify-between items-center w-full px-6 py-5 text-left"
                >
                  <span className="text-white text-lg md:text-xl font-medium pr-4">{item.question}</span>
                  <motion.div
                    animate={{ rotate: activeIndex === index ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-shrink-0 ml-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </motion.div>
                </button>
                
                {/* Fixed height container with internal animation */}
                <div className="relative w-full overflow-hidden">
                  <AnimatePresence initial={false}>
                    {activeIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ 
                          height: 'auto', 
                          opacity: 1,
                          transition: {
                            height: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
                            opacity: { duration: 0.2, delay: 0.1 }
                          }
                        }}
                        exit={{ 
                          height: 0, 
                          opacity: 0,
                          transition: {
                            height: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
                            opacity: { duration: 0.2 }
                          }
                        }}
                        className="w-full"
                        style={{ 
                          width: '100%', 
                          position: 'relative',
                          transformOrigin: 'top' 
                        }}
                      >
                        <div 
                          className="px-6 pb-6 text-slate-300 border-t border-slate-700/30 mt-1 pt-4"
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        >
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Contact CTA */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-slate-300 mb-6">
            Still have questions? We're here to help.
          </p>
           <a href='mailto:kaouter.karboub@gmail.com' rel="noopener noreferrer">
             <ShinyButton>Contact Support</ShinyButton>
           </a>
        </motion.div>
      </div>
    </section>
  );
}