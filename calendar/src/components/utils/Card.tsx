export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <div className={`rounded-xl shadow-md ${className}`}>{children}</div>;
  };
  
  export const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <div className={`p-4 ${className}`}>{children}</div>;
  };
  