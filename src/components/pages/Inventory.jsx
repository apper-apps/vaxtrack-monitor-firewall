import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Select from '@/components/atoms/Select'
import Card from '@/components/atoms/Card'
import Badge from '@/components/atoms/Badge'
import DataTable from '@/components/molecules/DataTable'
import SearchBar from '@/components/molecules/SearchBar'
import StatusAlert from '@/components/molecules/StatusAlert'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import { inventoryService } from '@/services/api/inventoryService'
import { vaccineService } from '@/services/api/vaccineService'
import { format, addDays } from 'date-fns'

const Inventory = () => {
  const [inventory, setInventory] = useState([])
  const [vaccines, setVaccines] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    vaccineFamily: '',
    alertLevel: '',
    location: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    vaccineId: '',
    lotNumber: '',
    quantityOnHand: '',
    expirationDate: '',
    location: 'Main Storage',
  })
  
  const [formErrors, setFormErrors] = useState({})
  
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [inventoryData, vaccinesData] = await Promise.all([
        inventoryService.getAll(),
        vaccineService.getAll(),
      ])
      
      setInventory(inventoryData)
      setVaccines(vaccinesData)
      setFilteredInventory(inventoryData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [])
  
  // Filter inventory based on search and filters
  useEffect(() => {
    let filtered = [...inventory]
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.vaccineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Vaccine family filter
    if (filters.vaccineFamily) {
      filtered = filtered.filter(item => {
        const vaccine = vaccines.find(v => v.commercialName === item.vaccineId)
        return vaccine?.vaccineFamily === filters.vaccineFamily
      })
    }
    
    // Alert level filter
    if (filters.alertLevel) {
      filtered = filtered.filter(item => {
        const alertLevel = getAlertLevel(item)
        return alertLevel === filters.alertLevel
      })
    }
    
    // Location filter
    if (filters.location) {
      filtered = filtered.filter(item => item.location === filters.location)
    }
    
    setFilteredInventory(filtered)
  }, [inventory, vaccines, searchTerm, filters])
  
  const getAlertLevel = (item) => {
    const today = new Date()
    const expirationDate = new Date(item.expirationDate)
    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiration < 0) return 'expired'
    if (daysUntilExpiration <= 7) return 'critical'
    if (daysUntilExpiration <= 30) return 'warning'
    if (item.quantityOnHand < 10) return 'low-stock'
    return 'good'
  }
  
  const getAlertBadge = (item) => {
    const alertLevel = getAlertLevel(item)
    
    switch (alertLevel) {
      case 'expired':
        return <Badge variant="error">Expired</Badge>
      case 'critical':
        return <Badge variant="error">Critical</Badge>
      case 'warning':
        return <Badge variant="warning">Warning</Badge>
      case 'low-stock':
        return <Badge variant="warning">Low Stock</Badge>
      default:
        return <Badge variant="success">Good</Badge>
    }
  }
  
  const getDaysUntilExpiration = (expirationDate) => {
    const today = new Date()
    const expDate = new Date(expirationDate)
    const diffTime = expDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  const handleSearch = (term) => {
    setSearchTerm(term)
  }
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }
  
  const clearFilters = () => {
    setFilters({
      vaccineFamily: '',
      alertLevel: '',
      location: '',
    })
    setSearchTerm('')
  }
  
  const validateForm = () => {
    const errors = {}
    
    if (!formData.vaccineId) errors.vaccineId = 'Vaccine is required'
    if (!formData.lotNumber) errors.lotNumber = 'Lot number is required'
    if (!formData.quantityOnHand) errors.quantityOnHand = 'Quantity is required'
    if (!formData.expirationDate) errors.expirationDate = 'Expiration date is required'
    if (!formData.location) errors.location = 'Location is required'
    
    // Validate numbers
    if (formData.quantityOnHand && (isNaN(formData.quantityOnHand) || parseInt(formData.quantityOnHand) < 0)) {
      errors.quantityOnHand = 'Must be a valid positive number'
    }
    
    // Validate expiration date
    if (formData.expirationDate && new Date(formData.expirationDate) < new Date()) {
      errors.expirationDate = 'Expiration date cannot be in the past'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting')
      return
    }
    
    try {
      setSubmitting(true)
      
      const inventoryData = {
        ...formData,
        quantityOnHand: parseInt(formData.quantityOnHand),
        lastUpdated: new Date().toISOString(),
      }
      
      if (editingItem) {
        await inventoryService.update(editingItem.Id, inventoryData)
        toast.success('Inventory item updated successfully')
      } else {
        await inventoryService.create(inventoryData)
        toast.success('Inventory item added successfully')
      }
      
      setShowAddForm(false)
      setEditingItem(null)
      setFormData({
        vaccineId: '',
        lotNumber: '',
        quantityOnHand: '',
        expirationDate: '',
        location: 'Main Storage',
      })
      setFormErrors({})
      
      await loadData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      vaccineId: item.vaccineId,
      lotNumber: item.lotNumber,
      quantityOnHand: item.quantityOnHand.toString(),
      expirationDate: item.expirationDate,
      location: item.location,
    })
    setShowAddForm(true)
  }
  
  const handleDelete = async (item) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await inventoryService.delete(item.Id)
        toast.success('Inventory item deleted successfully')
        await loadData()
      } catch (err) {
        toast.error(err.message)
      }
    }
  }
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  const columns = [
    {
      key: 'vaccineId',
      title: 'Vaccine',
      render: (value) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{value}</span>
          <span className="text-sm text-gray-500">
            {vaccines.find(v => v.commercialName === value)?.vaccineFamily || 'Unknown'}
          </span>
        </div>
      ),
    },
    {
      key: 'lotNumber',
      title: 'Lot Number',
      render: (value) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{value}</span>
      ),
    },
    {
      key: 'quantityOnHand',
      title: 'Quantity',
      render: (value) => (
        <span className="font-medium">{value} doses</span>
      ),
    },
    {
      key: 'expirationDate',
      title: 'Expiration Date',
      render: (value) => (
        <div className="flex flex-col">
          <span className="text-gray-600">{format(new Date(value), 'MMM dd, yyyy')}</span>
          <span className="text-sm text-gray-500">
            {getDaysUntilExpiration(value)} days remaining
          </span>
        </div>
      ),
    },
    {
      key: 'location',
      title: 'Location',
      render: (value) => (
        <span className="text-gray-600">{value}</span>
      ),
    },
    {
      key: 'alert',
      title: 'Status',
      render: (_, item) => getAlertBadge(item),
      sortable: false,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, item) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
          >
            <ApperIcon name="Edit" size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item)}
            className="text-red-600 hover:text-red-700"
          >
            <ApperIcon name="Trash2" size={16} />
          </Button>
        </div>
      ),
      sortable: false,
    },
  ]
  
  // Get unique values for filters
  const uniqueVaccineFamilies = [...new Set(vaccines.map(v => v.vaccineFamily))]
  const uniqueLocations = [...new Set(inventory.map(item => item.location))]
  
  const alertCounts = inventory.reduce((acc, item) => {
    const alertLevel = getAlertLevel(item)
    acc[alertLevel] = (acc[alertLevel] || 0) + 1
    return acc
  }, {})
  
  if (loading) {
    return <Loading type="table" />
  }
  
  if (error) {
    return <Error message={error} onRetry={loadData} />
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">
            Track and manage vaccine inventory with real-time alerts
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Add Inventory
        </Button>
      </div>
      
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(alertCounts.expired || 0) > 0 && (
          <StatusAlert
            type="error"
            title="Expired Vaccines"
            message={`${alertCounts.expired} vaccine lots have expired`}
            className="col-span-1"
          />
        )}
        {(alertCounts.critical || 0) > 0 && (
          <StatusAlert
            type="error"
            title="Critical Expiration"
            message={`${alertCounts.critical} vaccine lots expire within 7 days`}
            className="col-span-1"
          />
        )}
        {(alertCounts.warning || 0) > 0 && (
          <StatusAlert
            type="warning"
            title="Expiring Soon"
            message={`${alertCounts.warning} vaccine lots expire within 30 days`}
            className="col-span-1"
          />
        )}
        {(alertCounts['low-stock'] || 0) > 0 && (
          <StatusAlert
            type="warning"
            title="Low Stock"
            message={`${alertCounts['low-stock']} vaccine lots are low on stock`}
            className="col-span-1"
          />
        )}
      </div>
      
      {/* Search and Filters */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search by vaccine name, lot number, or location..."
                showFilters={true}
                onFilterClick={() => setShowFilters(!showFilters)}
                value={searchTerm}
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!searchTerm && !Object.values(filters).some(v => v)}
              >
                <ApperIcon name="X" size={16} className="mr-2" />
                Clear
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vaccine Family
                  </label>
                  <Select
                    value={filters.vaccineFamily}
                    onChange={(e) => handleFilterChange('vaccineFamily', e.target.value)}
                  >
                    <option value="">All families</option>
                    {uniqueVaccineFamilies.map(family => (
                      <option key={family} value={family}>{family}</option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert Level
                  </label>
                  <Select
                    value={filters.alertLevel}
                    onChange={(e) => handleFilterChange('alertLevel', e.target.value)}
                  >
                    <option value="">All alerts</option>
                    <option value="expired">Expired</option>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="good">Good</option>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <Select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  >
                    <option value="">All locations</option>
                    {uniqueLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
      
      {/* Form Modal */}
      {showAddForm && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit' : 'Add'} Inventory Item
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingItem(null)
                  setFormData({
                    vaccineId: '',
                    lotNumber: '',
                    quantityOnHand: '',
                    expirationDate: '',
                    location: 'Main Storage',
                  })
                  setFormErrors({})
                }}
              >
                <ApperIcon name="X" size={20} />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vaccine Type
                  </label>
                  <Select
                    value={formData.vaccineId}
                    onChange={(e) => handleInputChange('vaccineId', e.target.value)}
                    error={formErrors.vaccineId}
                  >
                    <option value="">Select vaccine...</option>
                    {vaccines.map((vaccine) => (
                      <option key={vaccine.Id} value={vaccine.commercialName}>
                        {vaccine.commercialName} ({vaccine.genericName})
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lot Number
                  </label>
                  <Input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) => handleInputChange('lotNumber', e.target.value)}
                    error={formErrors.lotNumber}
                    placeholder="Enter lot number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity on Hand
                  </label>
                  <Input
                    type="number"
                    value={formData.quantityOnHand}
                    onChange={(e) => handleInputChange('quantityOnHand', e.target.value)}
                    error={formErrors.quantityOnHand}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date
                  </label>
                  <Input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                    error={formErrors.expirationDate}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Location
                  </label>
                  <Select
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    error={formErrors.location}
                  >
                    <option value="Main Storage">Main Storage</option>
                    <option value="Cold Storage">Cold Storage</option>
                    <option value="Freezer">Freezer</option>
                    <option value="Backup Storage">Backup Storage</option>
                    <option value="Quarantine">Quarantine</option>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingItem(null)
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  disabled={submitting}
                >
                  {editingItem ? 'Update' : 'Add'} Item
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
      
      {/* Inventory Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Inventory Items
            </h3>
            <div className="text-sm text-gray-500">
              {filteredInventory.length} of {inventory.length} items
            </div>
          </div>
          
          {filteredInventory.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredInventory}
            />
          ) : searchTerm || Object.values(filters).some(v => v) ? (
            <Empty
              type="search"
              title="No Results Found"
              description="No inventory items match your search criteria. Try adjusting your filters."
              actionText="Clear Filters"
              onAction={clearFilters}
            />
          ) : (
            <Empty
              type="inventory"
              title="No Inventory Items"
              description="Your vaccine inventory is empty. Add your first inventory item to get started."
              actionText="Add Inventory"
              onAction={() => setShowAddForm(true)}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

export default Inventory