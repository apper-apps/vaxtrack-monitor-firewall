import { motion } from 'framer-motion'

const Card = ({ 
  children, 
  className = '',
  hover = false,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-md overflow-hidden'
  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow duration-200' : ''
  
  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default Card