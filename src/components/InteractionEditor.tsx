import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CompareContrastInteraction } from "./CompareContrastInteraction";
import { RiseCodeSnippet } from "./RiseCodeSnippet";
import { Download, Eye, Edit3 } from "lucide-react";

export const InteractionEditor = () => {
  const [activityInstructions, setActivityInstructions] = useState("It's time to reflect on the last SME conversation. Review the prompt below, enter your response, and then click the \"Compare Responses\" button to see how your response measures up to Julie's recommended approach.");
  const [prompt, setPrompt] = useState("Think about a specific situation and describe your approach. Provide details about your reasoning and any examples that support your response.");
  const [idealResponse, setIdealResponse] = useState("An effective response would typically include clear reasoning, specific examples, and consideration of multiple perspectives. The key elements should demonstrate understanding of the core concepts while showing practical application.");
  const [placeholder, setPlaceholder] = useState("Type your response here...");
  const [showPreview, setShowPreview] = useState(true);

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
              <Label htmlFor="placeholder">Placeholder Text</Label>
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
              onClick={exportAsHTML}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download HTML for Rise
            </Button>
          </div>
        </CardContent>
      </Card>

      <RiseCodeSnippet
        activityInstructions={activityInstructions}
        prompt={prompt}
        idealResponse={idealResponse}
        placeholder={placeholder}
      />

      {showPreview && (
        <div>
          <Separator />
          <div className="pt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </h3>
            <CompareContrastInteraction
              title="Compare & Contrast"
              prompt={prompt}
              idealResponse={idealResponse}
              placeholder={placeholder}
            />
          </div>
        </div>
      )}
    </div>
  );
};