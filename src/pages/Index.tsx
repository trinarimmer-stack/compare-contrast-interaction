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
          <p className="text-muted-foreground text-base">Create custom compare & contrast text entry interactions for use with the new Rise 360 code block—no Storyline block needed. Enter a writing prompt and an ideal response, click "Copy Code for Rise 360", and in Rise 360, insert a code block from the block library and paste the code into the code editor. That's it! Your custom compare & contrast text entry interaction is ready to use.</p>
        </div>

        <InteractionEditor />
      </div>
    </div>;
};
export default Index;