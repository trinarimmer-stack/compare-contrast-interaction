import { CompareContrastInteraction } from "@/components/CompareContrastInteraction";
import { useSearchParams } from "react-router-dom";

const InteractionDisplay = () => {
  const [searchParams] = useSearchParams();
  
  const title = searchParams.get('title') || 'Compare & Contrast';
  const prompt = searchParams.get('prompt') || 'Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.';
  const idealResponse = searchParams.get('idealResponse') || 'An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.';
  const placeholder = searchParams.get('placeholder') || 'Type your response here...';

  return (
    <div className="min-h-screen bg-background p-4">
      <CompareContrastInteraction
        title={title}
        prompt={prompt}
        idealResponse={idealResponse}
        placeholder={placeholder}
      />
    </div>
  );
};

export default InteractionDisplay;