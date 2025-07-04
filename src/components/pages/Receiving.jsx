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
import StatusAlert from '@/components/molecules/StatusAlert'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import { receiptService } from '@/services/api/receiptService'
import { vaccineService } from '@/services/api/vaccineService'
import { format } from 'date-fns'

const Receiving = () => {
  const [receipts, setReceipts] = useState([])
  const [vaccines, setVaccines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    vaccineId: '',
    lotNumber: '',
    quantitySent: '',
    quantityReceived: '',
    dosesPassed: '',
    dosesFailed: '',
    discrepancyReason: '',
    receivedDate: new Date().toISOString().split('T')[0],
  })
  
  const [formErrors, setFormErrors] = useState({})
  
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [receiptsData, vaccinesData] = await Promise.all([
        receiptService.getAll(),
        vaccineService.getAll(),
      ])
      
      setReceipts(receiptsData)
      setVaccines(vaccinesData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [])
  
  const validateForm = () => {
    const errors = {}
    
    if (!formData.vaccineId) errors.vaccineId = 'Vaccine is required'
    if (!formData.lotNumber) errors.lotNumber = 'Lot number is required'
    if (!formData.quantitySent) errors.quantitySent = 'Quantity sent is required'
    if (!formData.quantityReceived) errors.quantityReceived = 'Quantity received is required'
    if (!formData.dosesPassed) errors.dosesPassed = 'Doses passed inspection is required'
    if (!formData.dosesFailed) errors.dosesFailed = 'Doses failed inspection is required'
    if (!formData.receivedDate) errors.receivedDate = 'Received date is required'
    
    // Validate numbers
    if (formData.quantitySent && isNaN(formData.quantitySent)) {
      errors.quantitySent = 'Must be a valid number'
    }
    if (formData.quantityReceived && isNaN(formData.quantityReceived)) {
      errors.quantityReceived = 'Must be a valid number'
    }
    if (formData.dosesPassed && isNaN(formData.dosesPassed)) {
      errors.dosesPassed = 'Must be a valid number'
    }
    if (formData.dosesFailed && isNaN(formData.dosesFailed)) {
      errors.dosesFailed = 'Must be a valid number'
    }
    
    // Validate dose counts
    const totalDoses = parseInt(formData.dosesPassed || 0) + parseInt(formData.dosesFailed || 0)
    const quantityReceived = parseInt(formData.quantityReceived || 0)
    
    if (totalDoses !== quantityReceived) {
      errors.dosesPassed = 'Doses passed + failed must equal quantity received'
      errors.dosesFailed = 'Doses passed + failed must equal quantity received'
    }
    
    // Require discrepancy reason if there are failed doses
    if (parseInt(formData.dosesFailed || 0) > 0 && !formData.discrepancyReason) {
      errors.discrepancyReason = 'Discrepancy reason required when doses fail inspection'
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
      
      const receiptData = {
        ...formData,
        quantitySent: parseInt(formData.quantitySent),
        quantityReceived: parseInt(formData.quantityReceived),
        dosesPassed: parseInt(formData.dosesPassed),
        dosesFailed: parseInt(formData.dosesFailed),
      }
      
      await receiptService.create(receiptData)
      
      toast.success('Vaccine receipt recorded successfully')
      setShowForm(false)
      setFormData({
        vaccineId: '',
        lotNumber: '',
        quantitySent: '',
        quantityReceived: '',
        dosesPassed: '',
        dosesFailed: '',
        discrepancyReason: '',
        receivedDate: new Date().toISOString().split('T')[0],
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
    
    // Auto-calculate values
    if (field === 'quantityReceived' || field === 'dosesPassed') {
      const quantityReceived = parseInt(field === 'quantityReceived' ? value : formData.quantityReceived || 0)
      const dosesPassed = parseInt(field === 'dosesPassed' ? value : formData.dosesPassed || 0)
      
      if (quantityReceived > 0 && dosesPassed >= 0) {
        const dosesFailed = Math.max(0, quantityReceived - dosesPassed)
        setFormData(prev => ({ ...prev, dosesFailed: dosesFailed.toString() }))
      }
    }
  }
  
  const getStatusBadge = (receipt) => {
    const discrepancy = receipt.quantitySent !== receipt.quantityReceived
    const hasFailed = receipt.dosesFailed > 0
    
    if (discrepancy && hasFailed) {
      return <Badge variant="error">Multiple Issues</Badge>
    } else if (discrepancy) {
      return <Badge variant="warning">Quantity Discrepancy</Badge>
    } else if (hasFailed) {
      return <Badge variant="warning">Failed Inspection</Badge>
    } else {
      return <Badge variant="success">Complete</Badge>
    }
  }
  
  const columns = [
    {
      key: 'receivedDate',
      title: 'Date Received',
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
      key: 'quantitySent',
      title: 'Sent',
      render: (value) => (
        <span className="text-gray-600">{value} doses</span>
      ),
    },
    {
      key: 'quantityReceived',
      title: 'Received',
      render: (value) => (
        <span className="font-medium">{value} doses</span>
      ),
    },
    {
      key: 'dosesPassed',
      title: 'Passed',
      render: (value) => (
        <span className="text-success font-medium">{value} doses</span>
      ),
    },
    {
      key: 'dosesFailed',
      title: 'Failed',
      render: (value) => (
        <span className={`font-medium ${value > 0 ? 'text-error' : 'text-gray-400'}`}>
          {value} doses
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, receipt) => getStatusBadge(receipt),
      sortable: false,
    },
  ]
  
  if (loading) {
    return <Loading type="form" />
  }
  
  if (error) {
    return <Error message={error} onRetry={loadData} />
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vaccine Receiving</h1>
          <p className="text-gray-600 mt-1">
            Record and manage incoming vaccine shipments
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Record Receipt
        </Button>
      </div>
      
      {/* Form Modal */}
      {showForm && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Record Vaccine Receipt
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
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
                    Quantity Sent
                  </label>
                  <Input
                    type="number"
                    value={formData.quantitySent}
                    onChange={(e) => handleInputChange('quantitySent', e.target.value)}
                    error={formErrors.quantitySent}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity Received
                  </label>
                  <Input
                    type="number"
                    value={formData.quantityReceived}
                    onChange={(e) => handleInputChange('quantityReceived', e.target.value)}
                    error={formErrors.quantityReceived}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doses Passed Inspection
                  </label>
                  <Input
                    type="number"
                    value={formData.dosesPassed}
                    onChange={(e) => handleInputChange('dosesPassed', e.target.value)}
                    error={formErrors.dosesPassed}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doses Failed Inspection
                  </label>
                  <Input
                    type="number"
                    value={formData.dosesFailed}
                    onChange={(e) => handleInputChange('dosesFailed', e.target.value)}
                    error={formErrors.dosesFailed}
                    placeholder="0"
                    min="0"
                    readOnly
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Received Date
                  </label>
                  <Input
                    type="date"
                    value={formData.receivedDate}
                    onChange={(e) => handleInputChange('receivedDate', e.target.value)}
                    error={formErrors.receivedDate}
                  />
                </div>
                
                {parseInt(formData.dosesFailed || 0) > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discrepancy Reason
                    </label>
                    <Select
                      value={formData.discrepancyReason}
                      onChange={(e) => handleInputChange('discrepancyReason', e.target.value)}
                      error={formErrors.discrepancyReason}
                    >
                      <option value="">Select reason...</option>
                      <option value="Damaged packaging">Damaged packaging</option>
                      <option value="Temperature exposure">Temperature exposure</option>
                      <option value="Expired on arrival">Expired on arrival</option>
                      <option value="Manufacturing defect">Manufacturing defect</option>
                      <option value="Contamination">Contamination</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                )}
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
                  Record Receipt
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
      
      {/* Receipts Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Receipts
          </h3>
          
          {receipts.length > 0 ? (
            <DataTable
              columns={columns}
              data={receipts}
            />
          ) : (
            <Empty
              type="receiving"
              title="No Receipt Records"
              description="No vaccine receipts have been recorded yet. Start by recording your first vaccine shipment."
              actionText="Record Receipt"
              onAction={() => setShowForm(true)}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

export default Receiving