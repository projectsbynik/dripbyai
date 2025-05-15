import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { AlertCircle, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';

const alertVariants = cva(
  'relative flex items-start gap-3 p-4 rounded-lg border',
  {
    variants: {
      variant: {
        default: 'bg-dark-900/50 border-dark-800 text-dark-100',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-200',
        success: 'bg-green-500/10 border-green-500/20 text-green-200',
        warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200',
        error: 'bg-red-500/10 border-red-500/20 text-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const icons = {
  default: AlertCircle,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, description, onClose, children, ...props }, ref) => {
    const IconComponent = icons[variant || 'default'];
    
    return (
      <div
        ref={ref}
        className={cn(alertVariants({ variant }), className)}
        role="alert"
        {...props}
      >
        <div className="shrink-0 mt-0.5">
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1">
          {title && <h5 className="font-medium mb-1">{title}</h5>}
          {description && <div className="text-sm opacity-90">{description}</div>}
          {children}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full hover:bg-dark-800 transition-colors"
            aria-label="Close alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };