import { InteractionEditor } from "@/components/InteractionEditor";
const Index = () => {
  return <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Compare & Contrast Interaction Builder</h1>
          <div className="bg-muted/50 p-6 rounded-lg text-left max-w-3xl mx-auto">
            <div className="text-muted-foreground space-y-3">
              <p className="font-semibold">Want to add a Compare & Contrast activity to Rise 360? It's easy and only three steps:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Enter your writing prompt and ideal response in the Content Editor.</li>
                <li>Click Copy Code for Rise 360 to copy the generated code.</li>
                <li>In Rise 360, insert a Code Block from the block library and paste it in.</li>
              </ol>
              <p>That's it—your activity is ready to go!</p>
            </div>
          </div>
        </div>
        
        <InteractionEditor />
      </div>
    </div>;
};
export default Index;