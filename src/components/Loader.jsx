const Loader = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="relative">
        {/* Pulsing rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 border-4 border-primary/20 rounded-full animate-ping"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-accent/20 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Simple CSS Spinner */}
        <div className="w-24 h-24 rounded-full border-4 border-primary border-t-accent animate-spin relative z-10"></div>
      </div>
      
      {/* Loading Text */}
      <div className="mt-6 text-center">
        <h3 className="text-xl font-semibold text-primary font-heading tracking-tight">Zorix <span className="text-accent">School</span></h3>
        <p className="text-slate-500 mt-1 text-sm">{message}</p>
        
        {/* Loading Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
