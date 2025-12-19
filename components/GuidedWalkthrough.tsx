import React, { useState, useCallback } from 'react';
import { AppView } from '../types';
import { WalkthroughStep } from './WalkthroughStep';
import {
  WelcomeGraphic,
  SidebarGraphic,
  WizardGraphic,
  WorkflowGraphic,
  ClientsGraphic,
  CreditsGraphic,
  CompletionGraphic,
  ScoutGraphic,
  EditorGraphic,
  ArchivesGraphic,
} from './WalkthroughGraphics';

interface GuidedWalkthroughProps {
  onComplete: () => void;
  onNavigate: (view: AppView) => void;
}

interface WalkthroughStepConfig {
  id: string;
  type: 'modal' | 'spotlight';
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  graphic: React.ReactNode;
  title: string;
  description: string;
  primaryCtaText: string;
  secondaryCtaText?: string;
  navigateTo?: AppView;
}

const WALKTHROUGH_STEPS: WalkthroughStepConfig[] = [
  {
    id: 'welcome',
    type: 'modal',
    graphic: <WelcomeGraphic />,
    title: 'Welcome to RenovateMySite!',
    description: 'Your AI-powered business concierge. Let us show you around in about 2 minutes and help you get the most out of our platform.',
    primaryCtaText: 'Start Tour',
    secondaryCtaText: 'Skip Tour',
  },
  {
    id: 'sidebar',
    type: 'spotlight',
    targetSelector: '[data-walkthrough="sidebar"]',
    position: 'right',
    graphic: <SidebarGraphic />,
    title: 'Your Command Center',
    description: 'Access all your tools from this sidebar - from finding customers to managing invoices and communications. Everything you need is just one click away.',
    primaryCtaText: 'Next',
  },
  {
    id: 'wizard',
    type: 'spotlight',
    targetSelector: '[data-walkthrough="wizard"]',
    position: 'right',
    graphic: <WizardGraphic />,
    title: 'The Heart of RenovateMySite',
    description: 'This 5-step wizard takes you from finding a potential customer to sending them a personalized pitch with a website preview. It\'s your secret weapon!',
    primaryCtaText: 'Next',
    navigateTo: AppView.WIZARD,
  },
  {
    id: 'workflow',
    type: 'modal',
    graphic: <WorkflowGraphic />,
    title: 'Your Success Formula',
    description: 'Find leads, Analyze their brand, Visualize a website concept, Build the actual site, and Pitch your services. Each step is AI-powered - just provide the basics!',
    primaryCtaText: 'Got it!',
  },
  {
    id: 'scout',
    type: 'spotlight',
    targetSelector: '[data-walkthrough="scout"]',
    position: 'right',
    graphic: <ScoutGraphic />,
    title: 'Scout for Customers',
    description: 'Search for local businesses by type and location. Our AI scans Google Maps to find potential clients who need your services. Each search costs 5 credits.',
    primaryCtaText: 'Next',
  },
  {
    id: 'clients',
    type: 'spotlight',
    targetSelector: '[data-walkthrough="clients"]',
    position: 'right',
    graphic: <ClientsGraphic />,
    title: 'Manage Your Relationships',
    description: 'All your leads and customers live here. Track their status, send invoices, manage communications, and watch your business grow.',
    primaryCtaText: 'Next',
  },
  {
    id: 'editor',
    type: 'spotlight',
    targetSelector: '[data-walkthrough="editor"]',
    position: 'right',
    graphic: <EditorGraphic />,
    title: 'Website Editor',
    description: 'Edit and customize AI-generated websites with our drag-and-drop editor. Change colors, text, images, and layout - no coding required!',
    primaryCtaText: 'Next',
  },
  {
    id: 'archives',
    type: 'spotlight',
    targetSelector: '[data-walkthrough="archives"]',
    position: 'right',
    graphic: <ArchivesGraphic />,
    title: 'Your Content Archives',
    description: 'Access all your generated content history - websites, images, emails, and strategies. Everything is saved and organized by client.',
    primaryCtaText: 'Next',
  },
  {
    id: 'credits',
    type: 'spotlight',
    targetSelector: '[data-walkthrough="credits"]',
    position: 'bottom',
    graphic: <CreditsGraphic />,
    title: 'Pay As You Go',
    description: 'Each AI action uses credits. You start with 50 free credits. Find potential customers (5 credits), analyze brands (2 credits), build websites (10 credits), and more!',
    primaryCtaText: 'Almost done!',
  },
  {
    id: 'completion',
    type: 'modal',
    graphic: <CompletionGraphic />,
    title: "You're All Set!",
    description: 'Start by finding your first potential customer using the Concierge Wizard. We\'re here to help you win more clients!',
    primaryCtaText: 'Start Finding Customers',
    secondaryCtaText: 'Explore on My Own',
  },
];

export const GuidedWalkthrough: React.FC<GuidedWalkthroughProps> = ({
  onComplete,
  onNavigate,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleNext = useCallback(() => {
    const currentStep = WALKTHROUGH_STEPS[currentStepIndex];

    // Navigate if step requires it
    if (currentStep.navigateTo) {
      onNavigate(currentStep.navigateTo);
    }

    if (currentStepIndex < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Final step - complete and navigate to wizard
      onNavigate(AppView.WIZARD);
      onComplete();
    }
  }, [currentStepIndex, onComplete, onNavigate]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleSecondaryAction = useCallback(() => {
    // For completion step "Explore on My Own" or welcome "Skip Tour"
    onComplete();
  }, [onComplete]);

  const currentStep = WALKTHROUGH_STEPS[currentStepIndex];

  return (
    <>
      {/* Add keyframe animations via style tag */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>

      <WalkthroughStep
        type={currentStep.type}
        title={currentStep.title}
        description={currentStep.description}
        graphic={currentStep.graphic}
        targetSelector={currentStep.targetSelector}
        position={currentStep.position}
        currentStep={currentStepIndex}
        totalSteps={WALKTHROUGH_STEPS.length}
        primaryCta={{
          text: currentStep.primaryCtaText,
          onClick: handleNext,
        }}
        secondaryCta={
          currentStep.secondaryCtaText
            ? {
                text: currentStep.secondaryCtaText,
                onClick: handleSecondaryAction,
              }
            : undefined
        }
        onSkip={handleSkip}
      />
    </>
  );
};
