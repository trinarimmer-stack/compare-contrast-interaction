import { CompareContrastInteraction } from "@/components/CompareContrastInteraction";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Compare & Contrast Interaction</h1>
          <p className="text-muted-foreground">A responsive learning widget for Articulate Rise</p>
        </div>
        
        <div className="space-y-8">
          <CompareContrastInteraction
            title="Effective Leadership Qualities"
            prompt="Think about a leader you admire. Describe the key qualities that make them effective and provide a specific example of how they demonstrate these qualities in action."
            idealResponse="Effective leaders typically demonstrate qualities such as emotional intelligence, clear communication, adaptability, and the ability to inspire others. For example, a great leader might show emotional intelligence by recognizing when their team is stressed and proactively addressing concerns, communicating a clear vision that aligns individual goals with organizational objectives, adapting their leadership style to different team members' needs, and inspiring through their own actions and dedication to shared values."
            placeholder="Describe the leader you admire and their key qualities..."
          />
          
          <CompareContrastInteraction
            title="Problem-Solving Approach"
            prompt="Describe your approach to solving a complex problem at work. What steps do you take and how do you ensure you're considering all perspectives?"
            idealResponse="A systematic problem-solving approach typically includes: 1) Clearly defining the problem and its scope, 2) Gathering relevant information from multiple sources, 3) Identifying stakeholders and understanding their perspectives, 4) Brainstorming potential solutions without judgment, 5) Evaluating options against specific criteria, 6) Implementing the chosen solution with clear metrics, and 7) Monitoring results and adjusting as needed. This process ensures thorough analysis while remaining open to diverse viewpoints."
            placeholder="Outline your problem-solving process..."
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
