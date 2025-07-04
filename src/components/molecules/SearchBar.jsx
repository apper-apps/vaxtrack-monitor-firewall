import { useState } from 'react'
import ApperIcon from '@/components/ApperIcon'
import Input from '@/components/atoms/Input'
import Button from '@/components/atoms/Button'

const SearchBar = ({ 
  onSearch,
  placeholder = 'Search...',
  className = '',
  showFilters = false,
  onFilterClick,
  ...props 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(searchTerm)
  }
  
  const handleClear = () => {
    setSearchTerm('')
    onSearch('')
  }
  
  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <ApperIcon name="Search" size={16} className="text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
          {...props}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <ApperIcon name="X" size={16} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      
      <Button type="submit" variant="primary">
        <ApperIcon name="Search" size={16} />
      </Button>
      
      {showFilters && (
        <Button type="button" variant="outline" onClick={onFilterClick}>
          <ApperIcon name="Filter" size={16} className="mr-2" />
          Filters
        </Button>
      )}
    </form>
  )
}

export default SearchBar