import { motion } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'

const Empty = ({ 
  title = 'No data available',
  description = 'There are no items to display at the moment.',
  icon = 'Package',
  actionText,
  onAction,
  type = 'general'
}) => {
  const getEmptyContent = () => {
    switch (type) {
      case 'inventory':
        return {
          title: 'No Vaccines in Inventory',
          description: 'Your vaccine inventory is empty. Start by receiving a new vaccine shipment.',
          icon: 'Package',
          actionText: 'Receive Vaccines',
        }
      case 'receiving':
        return {
          title: 'No Receipts Found',
          description: 'No vaccine receipts have been recorded yet. Process your first vaccine shipment.',
          icon: 'Truck',
          actionText: 'Add Receipt',
        }
      case 'administration':
        return {
          title: 'No Administered Doses',
          description: 'No vaccine doses have been administered yet. Record your first dose administration.',
          icon: 'Syringe',
          actionText: 'Record Dose',
        }
      case 'loss':
        return {
          title: 'No Loss Reports',
          description: 'No vaccine losses have been reported. This is good news for your inventory!',
          icon: 'AlertTriangle',
          actionText: 'Report Loss',
        }
      case 'reports':
        return {
          title: 'No Reports Generated',
          description: 'No reports have been generated yet. Create your first inventory report.',
          icon: 'FileText',
          actionText: 'Generate Report',
        }
      case 'search':
        return {
          title: 'No Results Found',
          description: 'No items match your search criteria. Try adjusting your filters or search terms.',
          icon: 'Search',
          actionText: 'Clear Filters',
        }
      default:
        return {
          title,
          description,
          icon,
          actionText,
        }
    }
  }

  const content = getEmptyContent()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-md min-h-[400px]"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mb-6">
        <ApperIcon 
          name={content.icon} 
          size={40} 
          className="text-primary" 
        />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {content.title}
      </h3>
      
      <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
        {content.description}
      </p>
      
      {(content.actionText || actionText) && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onAction}
            className="btn-primary"
          >
            <ApperIcon name="Plus" size={16} className="mr-2" />
            {content.actionText || actionText}
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            className="btn-outline"
          >
            <ApperIcon name="RefreshCw" size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      )}
      
      <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
        <div className="flex items-center">
          <ApperIcon name="Shield" size={16} className="mr-2 text-success" />
          <span>Secure</span>
        </div>
        <div className="flex items-center">
          <ApperIcon name="Clock" size={16} className="mr-2 text-info" />
          <span>Real-time</span>
        </div>
        <div className="flex items-center">
          <ApperIcon name="CheckCircle" size={16} className="mr-2 text-success" />
          <span>Compliant</span>
        </div>
      </div>
    </motion.div>
  )
}

export default Empty