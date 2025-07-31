import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RiseCodeSnippetProps {
  title?: string;
  prompt?: string;
  idealResponse?: string;
  placeholder?: string;
}

export const RiseCodeSnippet = ({
  title = "Compare & Contrast",
  prompt = "Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.",
  idealResponse = "An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.",
  placeholder = "Type your response here..."
}: RiseCodeSnippetProps) => {
  const { toast } = useToast();

  const generateCodeSnippet = () => {
    return `<div id="compare-contrast-widget-${Date.now()}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 24px;">
    <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937;">${title}</h2>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${prompt}</p>
    
    <div id="input-section">
      <textarea 
        id="user-response" 
        placeholder="${placeholder}"
        style="width: 100%; min-height: 120px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; line-height: 1.5; resize: vertical; font-family: inherit; box-sizing: border-box;"
        rows="6"
      ></textarea>
      <div style="margin-top: 16px; text-align: right;">
        <button 
          id="compare-btn"
          onclick="compareResponses()"
          style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 14px; transition: background-color 0.2s;"
          onmouseover="this.style.backgroundColor='#2563eb'"
          onmouseout="this.style.backgroundColor='#3b82f6'"
        >
          Compare Responses
        </button>
      </div>
    </div>
    
    <div id="comparison-section" style="display: none;">
      <div style="display: flex; align-items: center; gap: 8px; color: #16a34a; margin-bottom: 24px;">
        <span style="font-size: 14px; font-weight: 500;">✓ Responses compared</span>
      </div>
      
      <div style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 24px;">
        <div style="border: 1px solid #bfdbfe; background: #dbeafe; border-radius: 8px; padding: 16px;">
          <div style="margin-bottom: 12px;">
            <span style="background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 8px; font-size: 12px; border-radius: 4px; font-weight: 500;">Your Response</span>
          </div>
          <p id="user-response-display" style="margin: 0; font-size: 14px; line-height: 1.5; color: #1f2937;"></p>
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
          onclick="resetInteraction()"
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
function compareResponses() {
  const userResponse = document.getElementById('user-response').value.trim();
  const compareBtn = document.getElementById('compare-btn');
  
  if (!userResponse) {
    alert('Please enter your response before comparing.');
    return;
  }
  
  // Hide input section
  document.getElementById('input-section').style.display = 'none';
  
  // Show comparison section
  document.getElementById('comparison-section').style.display = 'block';
  
  // Update user response display
  document.getElementById('user-response-display').textContent = userResponse;
}

function resetInteraction() {
  // Clear input
  document.getElementById('user-response').value = '';
  
  // Show input section
  document.getElementById('input-section').style.display = 'block';
  
  // Hide comparison section
  document.getElementById('comparison-section').style.display = 'none';
}

// Enable/disable compare button based on input
document.getElementById('user-response').addEventListener('input', function() {
  const compareBtn = document.getElementById('compare-btn');
  const hasText = this.value.trim().length > 0;
  
  compareBtn.disabled = !hasText;
  compareBtn.style.backgroundColor = hasText ? '#3b82f6' : '#9ca3af';
  compareBtn.style.cursor = hasText ? 'pointer' : 'not-allowed';
});

// Initial button state
document.getElementById('compare-btn').disabled = true;
document.getElementById('compare-btn').style.backgroundColor = '#9ca3af';
document.getElementById('compare-btn').style.cursor = 'not-allowed';
</script>`;
  };

  const copyToClipboard = () => {
    const snippet = generateCodeSnippet();
    navigator.clipboard.writeText(snippet).then(() => {
      toast({
        title: "Copied!",
        description: "Code snippet copied to clipboard. You can now paste it into Rise.",
      });
    });
  };

  const downloadSnippet = () => {
    const snippet = generateCodeSnippet();
    const blob = new Blob([snippet], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_rise_snippet.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rise Code Snippet Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This generates a self-contained HTML/JavaScript code snippet that you can paste directly into Rise's code snippet block. 
          No external dependencies required!
        </p>
        
        <div className="flex gap-3">
          <Button onClick={copyToClipboard} className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </Button>
          <Button onClick={downloadSnippet} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download HTML File
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">How to use in Rise:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Copy the code snippet using the button above</li>
            <li>In Rise, add a "Code" block to your lesson</li>
            <li>Paste the code snippet into the HTML/JavaScript field</li>
            <li>Save and preview your lesson</li>
          </ol>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Preview of generated snippet:</h4>
          <div 
            className="text-xs font-mono bg-background p-3 rounded border overflow-auto max-h-40"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {generateCodeSnippet().substring(0, 500)}...
          </div>
        </div>
      </CardContent>
    </Card>
  );
};