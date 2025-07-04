import { motion } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'

const Error = ({ 
  message = 'Something went wrong. Please try again.',
  onRetry,
  type = 'general'
}) => {
  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return 'Wifi'
      case 'server':
        return 'Server'
      case 'notfound':
        return 'Search'
      default:
        return 'AlertCircle'
    }
  }

  const getErrorTitle = () => {
    switch (type) {
      case 'network':
        return 'Connection Error'
      case 'server':
        return 'Server Error'
      case 'notfound':
        return 'Not Found'
      default:
        return 'Error'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md min-h-[400px]"
    >
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <ApperIcon 
          name={getErrorIcon()} 
          size={32} 
          className="text-error" 
        />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {getErrorTitle()}
      </h3>
      
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {message}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button 
            onClick={onRetry}
            className="btn-primary"
          >
            <ApperIcon name="RefreshCw" size={16} className="mr-2" />
            Try Again
          </Button>
        )}
        
        <Button 
          onClick={() => window.location.reload()}
          className="btn-outline"
        >
          <ApperIcon name="RotateCcw" size={16} className="mr-2" />
          Refresh Page
        </Button>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          If the problem persists, please contact support at{' '}
          <a 
            href="mailto:support@vaxtrack.com" 
            className="text-primary hover:underline"
          >
            support@vaxtrack.com
          </a>
        </p>
      </div>
    </motion.div>
  )
}

export default Error