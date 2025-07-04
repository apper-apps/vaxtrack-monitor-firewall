import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Card from '@/components/atoms/Card'
import Badge from '@/components/atoms/Badge'
import DataTable from '@/components/molecules/DataTable'
import StatusAlert from '@/components/molecules/StatusAlert'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import { inventoryService } from '@/services/api/inventoryService'
import { format } from 'date-fns'

const Reconciliation = () => {
  const [inventory, setInventory] = useState([])
  const [reconciliationData, setReconciliationData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [physicalCounts, setPhysicalCounts] = useState({})
  const [discrepancies, setDiscrepancies] = useState([])
  
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const inventoryData = await inventoryService.getAll()
      setInventory(inventoryData)
      
      // Initialize reconciliation data
      const reconciliationItems = inventoryData.map(item => ({
        ...item,
        systemCount: item.quantityOnHand,
        physicalCount: '',
        difference: 0,
        discrepancyReason: '',
        reconciled: false,
      }))
      
      setReconciliationData(reconciliationItems)
      
      // Set default month to current month
      const currentMonth = new Date().toISOString().slice(0, 7)
      setSelectedMonth(currentMonth)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [])
  
  const handlePhysicalCountChange = (itemId, count) => {
    const numCount = parseInt(count) || 0
    
    setPhysicalCounts(prev => ({
      ...prev,
      [itemId]: numCount
    }))
    
    // Update reconciliation data
    setReconciliationData(prev => 
      prev.map(item => {
        if (item.Id === itemId) {
          const difference = numCount - item.systemCount
          return {
            ...item,
            physicalCount: numCount,
            difference: difference,
            reconciled: difference === 0
          }
        }
        return item
      })
    )
  }
  
  const handleDiscrepancyReasonChange = (itemId, reason) => {
    setReconciliationData(prev => 
      prev.map(item => {
        if (item.Id === itemId) {
          return {
            ...item,
            discrepancyReason: reason
          }
        }
        return item
      })
    )
  }
  
  const calculateSummary = () => {
    const totalItems = reconciliationData.length
    const itemsWithCounts = reconciliationData.filter(item => item.physicalCount !== '').length
    const itemsReconciled = reconciliationData.filter(item => item.reconciled).length
    const itemsWithDiscrepancies = reconciliationData.filter(item => item.difference !== 0 && item.physicalCount !== '').length
    
    return {
      totalItems,
      itemsWithCounts,
      itemsReconciled,
      itemsWithDiscrepancies,
      progress: totalItems > 0 ? Math.round((itemsWithCounts / totalItems) * 100) : 0
    }
  }
  
  const validateReconciliation = () => {
    const errors = []
    
    if (!selectedMonth) {
      errors.push('Please select a reconciliation month')
    }
    
    const incompleteItems = reconciliationData.filter(item => item.physicalCount === '')
    if (incompleteItems.length > 0) {
      errors.push(`${incompleteItems.length} items are missing physical counts`)
    }
    
    const discrepancyItems = reconciliationData.filter(item => 
      item.difference !== 0 && !item.discrepancyReason
    )
    if (discrepancyItems.length > 0) {
      errors.push(`${discrepancyItems.length} items with discrepancies need explanations`)
    }
    
    return errors
  }
  
  const handleSubmitReconciliation = async () => {
    const errors = validateReconciliation()
    
    if (errors.length > 0) {
      toast.error(errors.join(', '))
      return
    }
    
    try {
      setSubmitting(true)
      
      // Update inventory with reconciled quantities
      const updates = reconciliationData
        .filter(item => item.difference !== 0)
        .map(item => 
          inventoryService.update(item.Id, {
            ...item,
            quantityOnHand: item.physicalCount,
            lastUpdated: new Date().toISOString()
          })
        )
      
      await Promise.all(updates)
      
      toast.success('Monthly reconciliation completed successfully')
      
      // Reset reconciliation
      setCurrentStep(1)
      setPhysicalCounts({})
      setDiscrepancies([])
      
      await loadData()
      
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  
  const getDifferenceBadge = (difference) => {
    if (difference === 0) {
      return <Badge variant="success">Reconciled</Badge>
    } else if (difference > 0) {
      return <Badge variant="info">+{difference}</Badge>
    } else {
      return <Badge variant="error">{difference}</Badge>
    }
  }
  
  const columns = [
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
      key: 'systemCount',
      title: 'System Count',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'physicalCount',
      title: 'Physical Count',
      render: (value, item) => (
        <Input
          type="number"
          value={physicalCounts[item.Id] || ''}
          onChange={(e) => handlePhysicalCountChange(item.Id, e.target.value)}
          className="w-20"
          min="0"
          placeholder="0"
        />
      ),
      sortable: false,
    },
    {
      key: 'difference',
      title: 'Difference',
      render: (value, item) => getDifferenceBadge(item.difference),
    },
    {
      key: 'discrepancyReason',
      title: 'Discrepancy Reason',
      render: (value, item) => (
        item.difference !== 0 && item.physicalCount !== '' ? (
          <select
            value={item.discrepancyReason}
            onChange={(e) => handleDiscrepancyReasonChange(item.Id, e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Select reason...</option>
            <option value="Administrative error">Administrative error</option>
            <option value="Damage/spillage">Damage/spillage</option>
            <option value="Expired doses removed">Expired doses removed</option>
            <option value="Theft/loss">Theft/loss</option>
            <option value="Transfer to other facility">Transfer to other facility</option>
            <option value="Counting error">Counting error</option>
            <option value="Other">Other</option>
          </select>
        ) : (
          <span className="text-gray-400">N/A</span>
        )
      ),
      sortable: false,
    },
  ]
  
  const summary = calculateSummary()
  
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
          <h1 className="text-2xl font-bold text-gray-900">Monthly Reconciliation</h1>
          <p className="text-gray-600 mt-1">
            Reconcile physical inventory with system records
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            Step {currentStep} of 3
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Progress Summary */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalItems}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.itemsWithCounts}</div>
              <div className="text-sm text-gray-500">Items Counted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.itemsReconciled}</div>
              <div className="text-sm text-gray-500">Reconciled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.itemsWithDiscrepancies}</div>
              <div className="text-sm text-gray-500">Discrepancies</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{summary.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${summary.progress}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
      
      {/* Step Navigation */}
      <div className="flex justify-center space-x-4">
        <Button
          variant={currentStep === 1 ? 'primary' : 'outline'}
          onClick={() => setCurrentStep(1)}
          disabled={submitting}
        >
          1. Setup
        </Button>
        <Button
          variant={currentStep === 2 ? 'primary' : 'outline'}
          onClick={() => setCurrentStep(2)}
          disabled={submitting}
        >
          2. Count
        </Button>
        <Button
          variant={currentStep === 3 ? 'primary' : 'outline'}
          onClick={() => setCurrentStep(3)}
          disabled={submitting}
        >
          3. Review
        </Button>
      </div>
      
      {/* Step 1: Setup */}
      {currentStep === 1 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reconciliation Setup
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reconciliation Month
                </label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-48"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <ApperIcon name="Info" size={20} className="text-blue-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">
                      Reconciliation Guidelines
                    </h4>
                    <ul className="mt-2 text-sm text-blue-700 space-y-1">
                      <li>• Count all vaccine doses physically present</li>
                      <li>• Record exact quantities found during physical count</li>
                      <li>• Provide explanations for any discrepancies</li>
                      <li>• Complete all items before finalizing reconciliation</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedMonth}
                >
                  Start Counting
                  <ApperIcon name="ArrowRight" size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Step 2: Physical Count */}
      {currentStep === 2 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Physical Inventory Count
            </h3>
            
            {inventory.length > 0 ? (
              <DataTable
                columns={columns}
                data={reconciliationData}
                sortable={false}
              />
            ) : (
              <Empty
                type="inventory"
                title="No Inventory Items"
                description="No inventory items found to reconcile."
              />
            )}
            
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={submitting}
              >
                <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={summary.itemsWithCounts === 0}
              >
                Review & Finalize
                <ApperIcon name="ArrowRight" size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Step 3: Review */}
      {currentStep === 3 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Review & Finalize
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">
                  Reconciliation Summary
                </h4>
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Month:</span>
                      <span className="ml-2 font-medium">
                        {selectedMonth ? format(new Date(selectedMonth + '-01'), 'MMMM yyyy') : 'Not selected'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Items Counted:</span>
                      <span className="ml-2 font-medium">{summary.itemsWithCounts} of {summary.totalItems}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reconciled:</span>
                      <span className="ml-2 font-medium text-green-600">{summary.itemsReconciled}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Discrepancies:</span>
                      <span className="ml-2 font-medium text-red-600">{summary.itemsWithDiscrepancies}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {summary.itemsWithDiscrepancies > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Items with Discrepancies
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="space-y-2">
                      {reconciliationData
                        .filter(item => item.difference !== 0 && item.physicalCount !== '')
                        .map(item => (
                          <div key={item.Id} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{item.vaccineId} - {item.lotNumber}</span>
                            <span className="text-red-600">
                              {item.difference > 0 ? '+' : ''}{item.difference} doses
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <ApperIcon name="AlertTriangle" size={20} className="text-yellow-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      Important Notice
                    </h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      Finalizing this reconciliation will update your inventory quantities to match the physical counts. 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={submitting}
                >
                  <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
                  Back to Count
                </Button>
                <Button
                  onClick={handleSubmitReconciliation}
                  loading={submitting}
                  disabled={submitting || validateReconciliation().length > 0}
                  variant="success"
                >
                  <ApperIcon name="Check" size={16} className="mr-2" />
                  Finalize Reconciliation
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default Reconciliation