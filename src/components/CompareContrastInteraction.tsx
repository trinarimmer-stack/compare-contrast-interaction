import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, RotateCcw } from "lucide-react";

interface CompareContrastInteractionProps {
  prompt: string;
  idealResponse: string;
  placeholder?: string;
  title?: string;
}

export const CompareContrastInteraction = ({
  prompt,
  idealResponse,
  placeholder = "Type your response here...",
  title = "Compare & Contrast"
}: CompareContrastInteractionProps) => {
  const [userResponse, setUserResponse] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleCompare = () => {
    if (userResponse.trim()) {
      setIsComparing(true);
      setHasSubmitted(true);
    }
  };

  const handleReset = () => {
    setUserResponse("");
    setIsComparing(false);
    setHasSubmitted(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {prompt}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isComparing ? (
            <div className="space-y-4">
              <Textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder={placeholder}
                className="min-h-[120px] resize-none text-sm leading-relaxed"
                rows={6}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleCompare}
                  disabled={!userResponse.trim()}
                  className="px-6"
                >
                  Compare Responses
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Responses compared</span>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border border-blue-200 bg-blue-50/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-700 border-blue-300">
                        Your Response
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-foreground">
                      {userResponse}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-green-200 bg-green-50/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Ideal Response
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-foreground">
                      {idealResponse}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="px-6"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};