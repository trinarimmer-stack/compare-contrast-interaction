import { InteractionEditor } from "@/components/InteractionEditor";
const Index = () => {
  return <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Compare & Contrast Interaction Builder</h1>
          <p className="text-muted-foreground">Create a compare & contrast activity for your Articulate Rise 360 projects. </p>
        </div>
        
        <InteractionEditor />
      </div>
    </div>;
};
export default Index;