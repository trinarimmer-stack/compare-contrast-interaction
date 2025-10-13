import { InteractionEditor } from "@/components/InteractionEditor";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Compare & Contrast Creator - GitHub Pages Test</h1>
          <p className="text-muted-foreground">Create custom learning interactions for Articulate Rise 360</p>
        </div>
        
        <InteractionEditor />
      </div>
    </div>
  );
};

export default Index;
