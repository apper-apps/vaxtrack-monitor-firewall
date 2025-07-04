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
import { lossService } from '@/services/api/lossService'
import { inventoryService } from '@/services/api/inventoryService'
import { format } from 'date-fns'

const LossReport = () => {
  const [losses, setLosses] = useState([])
  const [inventory, setInventory] = useState([])
  const [filteredLosses, setFilteredLosses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [trainingCompleted, setTrainingCompleted] = useState(false)
  const [showTrainingModal, setShowTrainingModal] = useState(false)
  
  const [formData, setFormData] = useState({
    vaccineId: '',
    lotNumber: '',
    quantity: '',
    reason: '',
    details: '',
    reportedDate: new Date().toISOString().split('T')[0],
  })
  
  const [formErrors, setFormErrors] = useState({})
  
  const lossReasons = [
    'Expired',
    'Broken vial',
    'Contaminated',
    'Power outage',
    'Equipment failure',
    'Temperature excursion',
    'Dropped/damaged',
    'Drawn up but not used',
    'Syringe left at room temperature',
    'Accidental exposure',
    'Other',
  ]
  
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [lossesData, inventoryData] = await Promise.all([
        lossService.getAll(),
        inventoryService.getAll(),
      ])
      
      setLosses(lossesData)
      setInventory(inventoryData)
      setFilteredLosses(lossesData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [])
  
  // Filter losses based on search
  useEffect(() => {
    let filtered = [...losses]
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.vaccineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredLosses(filtered)
  }, [losses, searchTerm])
  
  const handleSearch = (term) => {
    setSearchTerm(term)
  }
  
  const validateForm = () => {
    const errors = {}
    
    if (!formData.vaccineId) errors.vaccineId = 'Vaccine is required'
    if (!formData.lotNumber) errors.lotNumber = 'Lot number is required'
    if (!formData.quantity) errors.quantity = 'Quantity is required'
    if (!formData.reason) errors.reason = 'Loss reason is required'
    if (!formData.reportedDate) errors.reportedDate = 'Reported date is required'
    
    // Validate numbers
    if (formData.quantity && (isNaN(formData.quantity) || parseInt(formData.quantity) <= 0)) {
      errors.quantity = 'Must be a valid positive number'
    }
    
    // Validate date not in future
    if (formData.reportedDate && new Date(formData.reportedDate) > new Date()) {
      errors.reportedDate = 'Reported date cannot be in the future'
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
    if (inventoryItem && parseInt(formData.quantity) > inventoryItem.quantityOnHand) {
      errors.quantity = `Only ${inventoryItem.quantityOnHand} doses available in inventory`
    }
    
    // Require details for "Other" reason
    if (formData.reason === 'Other' && !formData.details) {
      errors.details = 'Details are required when selecting "Other" as reason'
    }
    
    // Check training completion
    if (!trainingCompleted) {
      errors.training = 'Training completion is required before reporting losses'
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
      
      const lossData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        trainingCompleted: trainingCompleted,
      }
      
      await lossService.create(lossData)
      
      // Update inventory
      const inventoryItem = inventory.find(item => 
        item.vaccineId === formData.vaccineId && 
        item.lotNumber === formData.lotNumber
      )
      
      if (inventoryItem) {
        const newQuantity = inventoryItem.quantityOnHand - parseInt(formData.quantity)
        await inventoryService.update(inventoryItem.Id, {
          ...inventoryItem,
          quantityOnHand: newQuantity,
          lastUpdated: new Date().toISOString(),
        })
      }
      
      toast.success('Loss report submitted successfully')
      setShowForm(false)
      setFormData({
        vaccineId: '',
        lotNumber: '',
        quantity: '',
        reason: '',
        details: '',
        reportedDate: new Date().toISOString().split('T')[0],
      })
      setFormErrors({})
      
      await loadData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
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
  
  const getReasonBadge = (reason) => {
    const variants = {
      'Expired': 'error',
      'Broken vial': 'warning',
      'Contaminated': 'error',
      'Power outage': 'error',
      'Equipment failure': 'error',
      'Temperature excursion': 'error',
      'Dropped/damaged': 'warning',
      'Drawn up but not used': 'warning',
      'Syringe left at room temperature': 'warning',
      'Accidental exposure': 'warning',
      'Other': 'secondary',
    }
    
    return <Badge variant={variants[reason] || 'default'}>{reason}</Badge>
  }
  
  const handleTrainingComplete = () => {
    setTrainingCompleted(true)
    setShowTrainingModal(false)
    toast.success('Training completed successfully')
  }
  
  const columns = [
    {
      key: 'reportedDate',
      title: 'Date Reported',
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
      key: 'quantity',
      title: 'Quantity Lost',
      render: (value) => (
        <span className="font-medium text-red-600">{value} doses</span>
      ),
    },
    {
      key: 'reason',
      title: 'Reason',
      render: (value) => getReasonBadge(value),
    },
    {
      key: 'details',
      title: 'Details',
      render: (value) => (
        <span className="text-gray-600 truncate max-w-xs" title={value}>
          {value || 'N/A'}
        </span>
      ),
    },
  ]
  
  // Get unique vaccines from inventory
  const uniqueVaccines = [...new Set(inventory.map(item => item.vaccineId))]
  
  // Calculate total losses
  const totalLosses = losses.reduce((sum, loss) => sum + loss.quantity, 0)
  const totalValue = losses.reduce((sum, loss) => sum + (loss.quantity * 50), 0) // Assuming $50 per dose
  
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
          <h1 className="text-2xl font-bold text-gray-900">Loss Reporting</h1>
          <p className="text-gray-600 mt-1">
            Report and track vaccine losses with required training compliance
          </p>
        </div>
        <Button
          onClick={() => {
            if (!trainingCompleted) {
              setShowTrainingModal(true)
            } else {
              setShowForm(true)
            }
          }}
          className="btn-primary"
        >
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Report Loss
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{losses.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="FileText" size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Losses</p>
                <p className="text-2xl font-bold text-red-600">{totalLosses} doses</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="AlertTriangle" size={24} className="text-red-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estimated Value</p>
                <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="DollarSign" size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Training Status */}
      {!trainingCompleted && (
        <StatusAlert
          type="warning"
          title="Training Required"
          message="Loss prevention training must be completed before reporting vaccine losses."
          actionText="Complete Training"
          onAction={() => setShowTrainingModal(true)}
        />
      )}
      
      {/* Search */}
      <Card>
        <div className="p-6">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by vaccine, lot number, or reason..."
            value={searchTerm}
          />
        </div>
      </Card>
      
      {/* Training Modal */}
      {showTrainingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Loss Prevention Training
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTrainingModal(false)}
                >
                  <ApperIcon name="X" size={20} />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Key Training Points
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Proper storage temperature maintenance</li>
                    <li>• Correct handling procedures</li>
                    <li>• Expiration date monitoring</li>
                    <li>• Emergency response protocols</li>
                    <li>• Documentation requirements</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">
                    Prevention Strategies
                  </h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Regular equipment maintenance</li>
                    <li>• Temperature monitoring systems</li>
                    <li>• Staff training and certification</li>
                    <li>• Inventory rotation procedures</li>
                    <li>• Backup power systems</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="font-medium text-red-900 mb-2">
                    Reporting Requirements
                  </h3>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Immediate documentation of losses</li>
                    <li>• Detailed reason explanations</li>
                    <li>• Corrective action plans</li>
                    <li>• Supervisor notification</li>
                    <li>• Regulatory compliance</li>
                  </ul>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="training-confirmation"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="training-confirmation" className="text-sm text-gray-700">
                    I confirm that I have read and understood the loss prevention training materials
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowTrainingModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTrainingComplete}
                    disabled={!document.getElementById('training-confirmation')?.checked}
                  >
                    Complete Training
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Form Modal */}
      {showForm && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Report Vaccine Loss
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    vaccineId: '',
                    lotNumber: '',
                    quantity: '',
                    reason: '',
                    details: '',
                    reportedDate: new Date().toISOString().split('T')[0],
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
                    Quantity Lost
                  </label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    error={formErrors.quantity}
                    min="1"
                    placeholder="Number of doses"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reported Date
                  </label>
                  <Input
                    type="date"
                    value={formData.reportedDate}
                    onChange={(e) => handleInputChange('reportedDate', e.target.value)}
                    error={formErrors.reportedDate}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loss Reason
                  </label>
                  <Select
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    error={formErrors.reason}
                  >
                    <option value="">Select reason...</option>
                    {lossReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Details
                    {formData.reason === 'Other' && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => handleInputChange('details', e.target.value)}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Provide additional details about the loss..."
                  />
                  {formErrors.details && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.details}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <ApperIcon name="CheckCircle" size={20} className="text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Training Completed
                    </p>
                    <p className="text-sm text-green-700">
                      Loss prevention training has been completed and verified.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
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
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
      
      {/* Loss Reports Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Loss Reports
            </h3>
            <div className="text-sm text-gray-500">
              {filteredLosses.length} of {losses.length} reports
            </div>
          </div>
          
          {filteredLosses.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredLosses}
            />
          ) : searchTerm ? (
            <Empty
              type="search"
              title="No Results Found"
              description="No loss reports match your search criteria."
              actionText="Clear Search"
              onAction={() => setSearchTerm('')}
            />
          ) : (
            <Empty
              type="loss"
              title="No Loss Reports"
              description="No vaccine losses have been reported yet. This is good news for your inventory!"
              actionText="Report Loss"
              onAction={() => {
                if (!trainingCompleted) {
                  setShowTrainingModal(true)
                } else {
                  setShowForm(true)
                }
              }}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

export default LossReport