import usableLearningLogo from "@/assets/usable-learning-logo-fixed.png";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-8">
          <img 
            src={usableLearningLogo} 
            alt="Usable Learning Logo" 
            className="mx-auto w-full max-w-2xl h-auto"
          />
        </div>
        <h1 className="text-4xl font-bold mb-4">Welcome to Usable Learning</h1>
        <p className="text-xl text-muted-foreground">Transforming learning into actionable results</p>
      </div>
    </div>
  );
};

export default Index;
