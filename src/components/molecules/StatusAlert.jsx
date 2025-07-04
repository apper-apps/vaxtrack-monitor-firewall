import { motion } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'

const StatusAlert = ({ 
  type = 'info',
  title,
  message,
  onClose,
  onAction,
  actionText,
  className = '',
  ...props 
}) => {
  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'Info',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'CheckCircle',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'AlertTriangle',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'AlertCircle',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
    },
  }
  
  const variant = variants[type]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-md border p-4 ${variant.bg} ${variant.border} ${className}`}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <ApperIcon name={variant.icon} size={20} className={variant.iconColor} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${variant.titleColor}`}>
              {title}
            </h3>
          )}
          {message && (
            <div className={`${title ? 'mt-1' : ''} text-sm ${variant.messageColor}`}>
              {message}
            </div>
          )}
          {(onAction || onClose) && (
            <div className="mt-3 flex space-x-2">
              {onAction && actionText && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAction}
                  className="text-xs"
                >
                  {actionText}
                </Button>
              )}
              {onClose && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="text-xs"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${variant.iconColor} hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <ApperIcon name="X" size={16} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default StatusAlert