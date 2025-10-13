import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CompareContrastInteraction } from "./CompareContrastInteraction";
import { Eye, Edit3, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const InteractionEditor = () => {
  const { toast } = useToast();
  const [activityInstructions, setActivityInstructions] = useState("It's time to reflect on the last conversation. Review the prompt below, enter your response, and then click the \"Compare Responses\" button to see how your response measures up to our recommended approach.");
  const [prompt, setPrompt] = useState("Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.");
  const [idealResponse, setIdealResponse] = useState("An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.");
  const [placeholder, setPlaceholder] = useState("Type your response here...");
  const [showPreview, setShowPreview] = useState(true);

  const generateRiseCodeSnippet = () => {
    const widgetId = `compare-contrast-widget-${Date.now()}`;
    return `<div id="${widgetId}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 24px;">
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1f2937;">📝 Compare and Contrast</h1>
      <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">${activityInstructions}</p>
    </div>
    
    <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937;">Compare & Contrast</h2>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${prompt}</p>
    
    <div id="${widgetId}-input-section">
      <textarea 
        id="${widgetId}-user-response" 
        placeholder="${placeholder}"
        style="width: 100%; min-height: 120px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; line-height: 1.5; resize: vertical; font-family: inherit; box-sizing: border-box;"
        rows="6"
      ></textarea>
      <div style="margin-top: 16px; text-align: right;">
        <button 
          id="${widgetId}-compare-btn"
          onclick="compareResponses${widgetId}()"
          style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 14px; transition: background-color 0.2s;"
          onmouseover="this.style.backgroundColor='#2563eb'"
          onmouseout="this.style.backgroundColor='#3b82f6'"
        >
          Compare Responses
        </button>
      </div>
    </div>
    
    <div id="${widgetId}-comparison-section" style="display: none;">
      <div style="display: flex; align-items: center; gap: 8px; color: #16a34a; margin-bottom: 24px;">
        <span style="font-size: 14px; font-weight: 500;">✓ Responses compared</span>
      </div>
      
      <div style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 24px;">
        <div style="border: 1px solid #bfdbfe; background: #dbeafe; border-radius: 8px; padding: 16px;">
          <div style="margin-bottom: 12px;">
            <span style="background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 8px; font-size: 12px; border-radius: 4px; font-weight: 500;">Your Response</span>
          </div>
          <p id="${widgetId}-user-response-display" style="margin: 0; font-size: 14px; line-height: 1.5; color: #1f2937;"></p>
        </div>
        
        <div style="border: 1px solid #bbf7d0; background: #dcfce7; border-radius: 8px; padding: 16px;">
          <div style="margin-bottom: 12px;">
            <span style="background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; padding: 4px 8px; font-size: 12px; border-radius: 4px; font-weight: 500;">Ideal Response</span>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1f2937;">${idealResponse}</p>
        </div>
      </div>
      
      <div style="text-align: center;">
        <button 
          onclick="resetInteraction${widgetId}()"
          style="background: white; color: #374151; border: 1px solid #d1d5db; padding: 10px 20px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 14px; transition: background-color 0.2s;"
          onmouseover="this.style.backgroundColor='#f9fafb'"
          onmouseout="this.style.backgroundColor='white'"
        >
          ↻ Try Again
        </button>
      </div>
    </div>
  </div>
</div>

<script>
function compareResponses${widgetId}() {
  const userResponse = document.getElementById('${widgetId}-user-response').value.trim();
  
  if (!userResponse) {
    alert('Please enter your response before comparing.');
    return;
  }
  
  // Hide input section
  document.getElementById('${widgetId}-input-section').style.display = 'none';
  
  // Show comparison section
  document.getElementById('${widgetId}-comparison-section').style.display = 'block';
  
  // Update user response display
  document.getElementById('${widgetId}-user-response-display').textContent = userResponse;
}

function resetInteraction${widgetId}() {
  // Clear input
  document.getElementById('${widgetId}-user-response').value = '';
  
  // Show input section
  document.getElementById('${widgetId}-input-section').style.display = 'block';
  
  // Hide comparison section
  document.getElementById('${widgetId}-comparison-section').style.display = 'none';
}

// Enable/disable compare button based on input
document.getElementById('${widgetId}-user-response').addEventListener('input', function() {
  const compareBtn = document.getElementById('${widgetId}-compare-btn');
  const hasText = this.value.trim().length > 0;
  
  compareBtn.disabled = !hasText;
  compareBtn.style.backgroundColor = hasText ? '#3b82f6' : '#9ca3af';
  compareBtn.style.cursor = hasText ? 'pointer' : 'not-allowed';
});

// Initial button state - only run when elements exist
if (document.getElementById('${widgetId}-compare-btn')) {
  document.getElementById('${widgetId}-compare-btn').disabled = true;
  document.getElementById('${widgetId}-compare-btn').style.backgroundColor = '#9ca3af';
  document.getElementById('${widgetId}-compare-btn').style.cursor = 'not-allowed';
}
</script>`;
  };

  const copyCodeToClipboard = () => {
    const snippet = generateRiseCodeSnippet();
    navigator.clipboard.writeText(snippet).then(() => {
      toast({
        title: "Copied!",
        description: "Code snippet copied to clipboard. You can now paste it into Rise 360.",
      });
    }).catch((err) => {
      console.error('Failed to copy:', err);
      toast({
        title: "Error",
        description: "Failed to copy code. Please try again.",
        variant: "destructive",
      });
    });
  };


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Content Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="activityInstructions">Activity Instructions</Label>
            <Textarea
              id="activityInstructions"
              value={activityInstructions}
              onChange={(e) => setActivityInstructions(e.target.value)}
              placeholder="Instructions that appear at the top of the interaction"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder Text for Learner Input Field</Label>
              <Input
                id="placeholder"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Hint text for learners"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt/Question</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the question or prompt for learners"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idealResponse">Ideal Response</Label>
            <Textarea
              id="idealResponse"
              value={idealResponse}
              onChange={(e) => setIdealResponse(e.target.value)}
              placeholder="Enter the model answer for comparison"
              rows={4}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button
              onClick={copyCodeToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Code for Rise 360
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompareContrastInteraction
              prompt={prompt}
              idealResponse={idealResponse}
              placeholder={placeholder}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};