import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CompareContrastInteraction } from "./CompareContrastInteraction";
import { RiseCodeSnippet } from "./RiseCodeSnippet";
import { Eye, Edit3, Copy } from "lucide-react";

export const InteractionEditor = () => {
  const [activityInstructions, setActivityInstructions] = useState("It's time to reflect on the last conversation. Review the prompt below, enter your response, and then click the \"Compare Responses\" button to see how your response measures up to our recommended approach.");
  const [prompt, setPrompt] = useState("Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.");
  const [idealResponse, setIdealResponse] = useState("An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.");
  const [placeholder, setPlaceholder] = useState("Type your response here...");
  const [showPreview, setShowPreview] = useState(true);

  const getCodeContent = () => {
    return `<style>
  .compare-container { max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .compare-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .compare-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #111827; }
  .compare-prompt { color: #6b7280; margin-bottom: 24px; line-height: 1.6; }
  .compare-textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; resize: vertical; min-height: 120px; font-size: 14px; font-family: inherit; }
  .compare-textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
  .compare-btn { padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px; cursor: pointer; transition: all 0.2s; border: none; }
  .compare-btn-primary { background: #3b82f6; color: white; }
  .compare-btn-primary:hover:not(:disabled) { background: #2563eb; }
  .compare-btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }
  .compare-btn-outline { background: white; color: #374151; border: 1px solid #d1d5db; }
  .compare-btn-outline:hover { background: #f9fafb; }
  .compare-success { color: #059669; font-weight: 500; margin-bottom: 24px; font-size: 14px; }
  .compare-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px; }
  @media (min-width: 768px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
  .compare-response-card { border-radius: 6px; padding: 16px; border: 1px solid; }
  .compare-response-card.user { background: #eff6ff; border-color: #bfdbfe; }
  .compare-response-card.ideal { background: #f0fdf4; border-color: #bbf7d0; }
  .compare-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
  .compare-badge.user { background: #dbeafe; color: #1e40af; }
  .compare-badge.ideal { background: #dcfce7; color: #166534; }
  .compare-text { font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-wrap; }
  .compare-actions { text-align: right; }
  .compare-center { text-align: center; }
</style>

<div class="compare-container">
  <div class="compare-card" id="compareCard">
    <h2 class="compare-title">Compare & Contrast</h2>
    <p class="compare-prompt">${prompt}</p>
    
    <div id="inputView">
      <textarea 
        class="compare-textarea" 
        id="userInput"
        placeholder="${placeholder}"
      ></textarea>
      <div class="compare-actions" style="margin-top: 16px;">
        <button class="compare-btn compare-btn-primary" id="compareBtn" disabled>
          Compare Responses
        </button>
      </div>
    </div>
    
    <div id="comparisonView" style="display: none;">
      <div class="compare-success">✓ Responses compared</div>
      
      <div class="compare-grid">
        <div class="compare-response-card user">
          <div class="compare-badge user">Your Response</div>
          <p class="compare-text" id="userResponseText"></p>
        </div>
        
        <div class="compare-response-card ideal">
          <div class="compare-badge ideal">Ideal Response</div>
          <p class="compare-text">${idealResponse}</p>
        </div>
      </div>
      
      <div class="compare-center">
        <button class="compare-btn compare-btn-outline" id="resetBtn">
          ↻ Try Again
        </button>
      </div>
    </div>
  </div>
</div>

<script>
(function() {
  const userInput = document.getElementById('userInput');
  const compareBtn = document.getElementById('compareBtn');
  const resetBtn = document.getElementById('resetBtn');
  const inputView = document.getElementById('inputView');
  const comparisonView = document.getElementById('comparisonView');
  const userResponseText = document.getElementById('userResponseText');
  
  userInput.addEventListener('input', function() {
    compareBtn.disabled = !this.value.trim();
  });
  
  compareBtn.addEventListener('click', function() {
    const response = userInput.value.trim();
    if (response) {
      userResponseText.textContent = response;
      inputView.style.display = 'none';
      comparisonView.style.display = 'block';
    }
  });
  
  resetBtn.addEventListener('click', function() {
    userInput.value = '';
    compareBtn.disabled = true;
    inputView.style.display = 'block';
    comparisonView.style.display = 'none';
  });
})();
</script>`;
  };

  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getCodeContent());
      // Could add a toast notification here
      alert('Code copied to clipboard! Now paste it into Rise\'s code block.');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy. Please try the download button instead.');
    }
  };

  const exportForCodeBlock = () => {
    const codeContent = getCodeContent();
    const blob = new Blob([codeContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compare-contrast-code-block.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compare & Contrast</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .btn { padding: 8px 16px; border-radius: 6px; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background: #3b82f6; color: white; border: none; }
        .btn-primary:hover { background: #2563eb; }
        .btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }
        .btn-outline { background: white; color: #374151; border: 1px solid #d1d5db; }
        .btn-outline:hover { background: #f9fafb; }
        .textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; resize: none; }
        .badge { display: inline-flex; align-items: center; padding: 4px 8px; font-size: 12px; border-radius: 4px; font-weight: 500; }
        .badge-blue { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .badge-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    </style>
</head>
<body class="bg-gray-50 p-4">
    <div id="root"></div>
    <script type="text/babel">
        const { useState } = React;
        
        const CompareContrastInteraction = () => {
            const [userResponse, setUserResponse] = useState("");
            const [isComparing, setIsComparing] = useState(false);
            
            const handleCompare = () => {
                if (userResponse.trim()) {
                    setIsComparing(true);
                }
            };
            
            const handleReset = () => {
                setUserResponse("");
                setIsComparing(false);
            };
            
            return (
                <div className="max-w-4xl mx-auto">
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold mb-2">Compare & Contrast</h2>
                        <p className="text-gray-600 mb-6">${prompt}</p>
                        
                        {!isComparing ? (
                            <div>
                                <textarea 
                                    className="textarea mb-4" 
                                    rows="6" 
                                    placeholder="${placeholder}"
                                    value={userResponse}
                                    onChange={(e) => setUserResponse(e.target.value)}
                                />
                                <div className="text-right">
                                    <button 
                                        className="btn btn-primary"
                                        disabled={!userResponse.trim()}
                                        onClick={handleCompare}
                                    >
                                        Compare Responses
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 text-green-600 mb-6">
                                    <span className="text-sm font-medium">✓ Responses compared</span>
                                </div>
                                
                                <div className="grid gap-4 md:grid-cols-2 mb-6">
                                    <div className="card border-blue-200 bg-blue-50 p-4">
                                        <div className="mb-3">
                                            <span className="badge badge-blue">Your Response</span>
                                        </div>
                                        <p className="text-sm">{userResponse}</p>
                                    </div>
                                    
                                    <div className="card border-green-200 bg-green-50 p-4">
                                        <div className="mb-3">
                                            <span className="badge badge-green">Ideal Response</span>
                                        </div>
                                        <p className="text-sm">${idealResponse}</p>
                                    </div>
                                </div>
                                
                                <div className="text-center">
                                    <button className="btn btn-outline" onClick={handleReset}>
                                        ↻ Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        };
        
        ReactDOM.render(<CompareContrastInteraction />, document.getElementById('root'));
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Compare_Contrast_interaction.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              Copy Code
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

      <RiseCodeSnippet
        activityInstructions={activityInstructions}
        prompt={prompt}
        idealResponse={idealResponse}
        placeholder={placeholder}
      />
    </div>
  );
};