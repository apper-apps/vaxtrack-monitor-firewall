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
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import { administrationService } from '@/services/api/administrationService'
import { inventoryService } from '@/services/api/inventoryService'
import { format } from 'date-fns'

const Administration = () => {
  const [administrations, setAdministrations] = useState([])
  const [inventory, setInventory] = useState([])
  const [filteredAdministrations, setFilteredAdministrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    vaccineId: '',
    lotNumber: '',
    patientAgeGroup: '',
    administeredDate: new Date().toISOString().split('T')[0],
    dosesUsed: '1',
    providerId: 'Provider-001',
  })
  
  const [formErrors, setFormErrors] = useState({})
  
  const ageGroups = [
    '0-6 months',
    '6-12 months',
    '1-2 years',
    '2-5 years',
    '5-12 years',
    '12-18 years',
    '18-65 years',
    '65+ years',
  ]
  
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [administrationsData, inventoryData] = await Promise.all([
        administrationService.getAll(),
        inventoryService.getAll(),
      ])
      
      setAdministrations(administrationsData)
      setInventory(inventoryData)
      setFilteredAdministrations(administrationsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [])
  
  // Filter administrations based on search
  useEffect(() => {
    let filtered = [...administrations]
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.vaccineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patientAgeGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.providerId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredAdministrations(filtered)
  }, [administrations, searchTerm])
  
  const handleSearch = (term) => {
    setSearchTerm(term)
  }
  
  const validateForm = () => {
    const errors = {}
    
    if (!formData.vaccineId) errors.vaccineId = 'Vaccine is required'
    if (!formData.lotNumber) errors.lotNumber = 'Lot number is required'
    if (!formData.patientAgeGroup) errors.patientAgeGroup = 'Patient age group is required'
    if (!formData.administeredDate) errors.administeredDate = 'Administration date is required'
    if (!formData.dosesUsed) errors.dosesUsed = 'Doses used is required'
    if (!formData.providerId) errors.providerId = 'Provider ID is required'
    
    // Validate numbers
    if (formData.dosesUsed && (isNaN(formData.dosesUsed) || parseInt(formData.dosesUsed) <= 0)) {
      errors.dosesUsed = 'Must be a valid positive number'
    }
    
    // Validate date not in future
    if (formData.administeredDate && new Date(formData.administeredDate) > new Date()) {
      errors.administeredDate = 'Administration date cannot be in the future'
    }
    
    // Check if lot number exists in inventory
    const inventoryItem = inventory.find(item => 
      item.vaccineId === formData.vaccineId && 
      item.lotNumber === formData.lotNumber
    )
    
    if (formData.vaccineId && formData.lotNumber && !inventoryItem) {
      errors.lotNumber = 'Lot number not found in inventory for selected vaccine'
    }
    
    // Check if sufficient doses available
    if (inventoryItem && parseInt(formData.dosesUsed) > inventoryItem.quantityOnHand) {
      errors.dosesUsed = `Only ${inventoryItem.quantityOnHand} doses available in inventory`
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
      
      const administrationData = {
        ...formData,
        dosesUsed: parseInt(formData.dosesUsed),
      }
      
      if (editingItem) {
        await administrationService.update(editingItem.Id, administrationData)
        toast.success('Administration record updated successfully')
      } else {
        await administrationService.create(administrationData)
        
        // Update inventory
        const inventoryItem = inventory.find(item => 
          item.vaccineId === formData.vaccineId && 
          item.lotNumber === formData.lotNumber
        )
        
        if (inventoryItem) {
          const newQuantity = inventoryItem.quantityOnHand - parseInt(formData.dosesUsed)
          await inventoryService.update(inventoryItem.Id, {
            ...inventoryItem,
            quantityOnHand: newQuantity,
            lastUpdated: new Date().toISOString(),
          })
        }
        
        toast.success('Dose administration recorded successfully')
      }
      
      setShowForm(false)
      setEditingItem(null)
      setFormData({
        vaccineId: '',
        lotNumber: '',
        patientAgeGroup: '',
        administeredDate: new Date().toISOString().split('T')[0],
        dosesUsed: '1',
        providerId: 'Provider-001',
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
      patientAgeGroup: item.patientAgeGroup,
      administeredDate: item.administeredDate,
      dosesUsed: item.dosesUsed.toString(),
      providerId: item.providerId,
    })
    setShowForm(true)
  }
  
  const handleDelete = async (item) => {
    if (window.confirm('Are you sure you want to delete this administration record?')) {
      try {
        await administrationService.delete(item.Id)
        toast.success('Administration record deleted successfully')
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
    
    // Auto-populate lot numbers when vaccine is selected
    if (field === 'vaccineId' && value) {
      const availableLots = inventory.filter(item => 
        item.vaccineId === value && item.quantityOnHand > 0
      )
      
      if (availableLots.length === 1) {
        setFormData(prev => ({ ...prev, lotNumber: availableLots[0].lotNumber }))
      }
    }
  }
  
  const getAvailableLots = (vaccineId) => {
    return inventory.filter(item => 
      item.vaccineId === vaccineId && item.quantityOnHand > 0
    )
  }
  
  const getAgeGroupBadge = (ageGroup) => {
    const variants = {
      '0-6 months': 'error',
      '6-12 months': 'warning',
      '1-2 years': 'info',
      '2-5 years': 'info',
      '5-12 years': 'secondary',
      '12-18 years': 'secondary',
      '18-65 years': 'primary',
      '65+ years': 'success',
    }
    
    return <Badge variant={variants[ageGroup] || 'default'}>{ageGroup}</Badge>
  }
  
  const columns = [
    {
      key: 'administeredDate',
      title: 'Date',
      render: (value) => (
        <span className="text-gray-600">{format(new Date(value), 'MMM dd, yyyy')}</span>
      ),
    },
    {
      key: 'vaccineId',
      title: 'Vaccine',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
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
      key: 'patientAgeGroup',
      title: 'Age Group',
      render: (value) => getAgeGroupBadge(value),
    },
    {
      key: 'dosesUsed',
      title: 'Doses Used',
      render: (value) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: 'providerId',
      title: 'Provider',
      render: (value) => (
        <span className="text-gray-600">{value}</span>
      ),
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
  
  // Get unique vaccines from inventory
  const uniqueVaccines = [...new Set(inventory.map(item => item.vaccineId))]
  
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
          <h1 className="text-2xl font-bold text-gray-900">Dose Administration</h1>
          <p className="text-gray-600 mt-1">
            Record and manage vaccine dose administrations
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Record Administration
        </Button>
      </div>
      
      {/* Search */}
      <Card>
        <div className="p-6">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by vaccine, lot number, age group, or provider..."
            value={searchTerm}
          />
        </div>
      </Card>
      
      {/* Form Modal */}
      {showForm && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit' : 'Record'} Dose Administration
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false)
                  setEditingItem(null)
                  setFormData({
                    vaccineId: '',
                    lotNumber: '',
                    patientAgeGroup: '',
                    administeredDate: new Date().toISOString().split('T')[0],
                    dosesUsed: '1',
                    providerId: 'Provider-001',
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
                    {uniqueVaccines.map((vaccine) => (
                      <option key={vaccine} value={vaccine}>
                        {vaccine}
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lot Number
                  </label>
                  <Select
                    value={formData.lotNumber}
                    onChange={(e) => handleInputChange('lotNumber', e.target.value)}
                    error={formErrors.lotNumber}
                    disabled={!formData.vaccineId}
                  >
                    <option value="">Select lot number...</option>
                    {getAvailableLots(formData.vaccineId).map((item) => (
                      <option key={item.Id} value={item.lotNumber}>
                        {item.lotNumber} ({item.quantityOnHand} doses available)
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Age Group
                  </label>
                  <Select
                    value={formData.patientAgeGroup}
                    onChange={(e) => handleInputChange('patientAgeGroup', e.target.value)}
                    error={formErrors.patientAgeGroup}
                  >
                    <option value="">Select age group...</option>
                    {ageGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Administration Date
                  </label>
                  <Input
                    type="date"
                    value={formData.administeredDate}
                    onChange={(e) => handleInputChange('administeredDate', e.target.value)}
                    error={formErrors.administeredDate}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doses Used
                  </label>
                  <Input
                    type="number"
                    value={formData.dosesUsed}
                    onChange={(e) => handleInputChange('dosesUsed', e.target.value)}
                    error={formErrors.dosesUsed}
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider ID
                  </label>
                  <Input
                    type="text"
                    value={formData.providerId}
                    onChange={(e) => handleInputChange('providerId', e.target.value)}
                    error={formErrors.providerId}
                    placeholder="Provider-001"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
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
                  {editingItem ? 'Update' : 'Record'} Administration
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
      
      {/* Administrations Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Administration Records
            </h3>
            <div className="text-sm text-gray-500">
              {filteredAdministrations.length} of {administrations.length} records
            </div>
          </div>
          
          {filteredAdministrations.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredAdministrations}
            />
          ) : searchTerm ? (
            <Empty
              type="search"
              title="No Results Found"
              description="No administration records match your search criteria."
              actionText="Clear Search"
              onAction={() => setSearchTerm('')}
            />
          ) : (
            <Empty
              type="administration"
              title="No Administration Records"
              description="No vaccine doses have been administered yet. Record your first dose administration to get started."
              actionText="Record Administration"
              onAction={() => setShowForm(true)}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

export default Administration