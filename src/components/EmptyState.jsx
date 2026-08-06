import { Inbox } from 'lucide-react';

const EmptyState = ({ 
  title = "No Data Found", 
  message = "There's nothing to display here yet.",
  actionLabel,
  onAction,
  icon: Icon = Inbox
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
          <Icon className="w-10 h-10 text-slate-400" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 font-heading text-center">
        {title}
      </h3>
      <p className="text-gray-500 mt-2 text-center max-w-md">
        {message}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-6 py-3 bg-primary text-secondary font-semibold rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
