import { InteractionEditor } from "@/components/InteractionEditor";
import logo from "@/assets/tr-logomark.png";

const Index = () => {
  return <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <img src={logo} alt="Usable Learning" className="h-12 w-auto" />
            <h1 className="text-3xl font-bold text-foreground">Compare & Contrast Interaction Builder</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Create compare & contrast activities for use with the code block in Articulate Rise 360. Enable xAPI tracking for use with your LRS.
          </p>
        </div>

        <div className="mb-8">
          <div className="text-left max-w-3xl">
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