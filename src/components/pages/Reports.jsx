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
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import { inventoryService } from '@/services/api/inventoryService'
import { administrationService } from '@/services/api/administrationService'
import { lossService } from '@/services/api/lossService'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

const Reports = () => {
  const [reportData, setReportData] = useState({
    inventory: [],
    administrations: [],
    losses: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeReport, setActiveReport] = useState('inventory')
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()).toISOString().split('T')[0],
    endDate: endOfMonth(new Date()).toISOString().split('T')[0],
  })
  const [filters, setFilters] = useState({
    vaccineType: '',
    location: '',
    status: '',
  })
  const [generating, setGenerating] = useState(false)
  
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [inventoryData, administrationData, lossData] = await Promise.all([
        inventoryService.getAll(),
        administrationService.getAll(),
        lossService.getAll(),
      ])
      
      setReportData({
        inventory: inventoryData,
        administrations: administrationData,
        losses: lossData,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [])
  
  const reportTypes = [
    {
      id: 'inventory',
      name: 'Current Inventory',
      description: 'Current stock levels and expiration dates',
      icon: 'Package',
    },
    {
      id: 'administration',
      name: 'Administration Report',
      description: 'Vaccine doses administered by date range',
      icon: 'Syringe',
    },
    {
      id: 'loss',
      name: 'Loss Report',
      description: 'Vaccine losses and wastage by date range',
      icon: 'AlertTriangle',
    },
    {
      id: 'summary',
      name: 'Monthly Summary',
      description: 'Comprehensive monthly activity summary',
      icon: 'FileText',
    },
  ]
  
  const getFilteredData = () => {
    const startDate = new Date(dateRange.startDate)
    const endDate = new Date(dateRange.endDate)
    
    switch (activeReport) {
      case 'inventory':
        return reportData.inventory.filter(item => {
          const matchesVaccine = !filters.vaccineType || item.vaccineId === filters.vaccineType
          const matchesLocation = !filters.location || item.location === filters.location
          const matchesStatus = !filters.status || getInventoryStatus(item) === filters.status
          return matchesVaccine && matchesLocation && matchesStatus
        })
      
      case 'administration':
        return reportData.administrations.filter(item => {
          const itemDate = new Date(item.administeredDate)
          const matchesDate = itemDate >= startDate && itemDate <= endDate
          const matchesVaccine = !filters.vaccineType || item.vaccineId === filters.vaccineType
          return matchesDate && matchesVaccine
        })
      
      case 'loss':
        return reportData.losses.filter(item => {
          const itemDate = new Date(item.reportedDate)
          const matchesDate = itemDate >= startDate && itemDate <= endDate
          const matchesVaccine = !filters.vaccineType || item.vaccineId === filters.vaccineType
          return matchesDate && matchesVaccine
        })
      
      default:
        return []
    }
  }
  
  const getInventoryStatus = (item) => {
    const today = new Date()
    const expirationDate = new Date(item.expirationDate)
    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiration < 0) return 'expired'
    if (daysUntilExpiration <= 7) return 'critical'
    if (daysUntilExpiration <= 30) return 'warning'
    if (item.quantityOnHand < 10) return 'low-stock'
    return 'good'
  }
  
  const getStatusBadge = (status) => {
    const variants = {
      expired: 'error',
      critical: 'error',
      warning: 'warning',
      'low-stock': 'warning',
      good: 'success',
    }
    
    const labels = {
      expired: 'Expired',
      critical: 'Critical',
      warning: 'Warning',
      'low-stock': 'Low Stock',
      good: 'Good',
    }
    
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }
  
  const inventoryColumns = [
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
        <span className="text-gray-600">{format(new Date(value), 'MMM dd, yyyy')}</span>
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
      key: 'status',
      title: 'Status',
      render: (_, item) => getStatusBadge(getInventoryStatus(item)),
      sortable: false,
    },
  ]
  
  const administrationColumns = [
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
      render: (value) => (
        <Badge variant="info">{value}</Badge>
      ),
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
  ]
  
  const lossColumns = [
    {
      key: 'reportedDate',
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
      key: 'quantity',
      title: 'Quantity Lost',
      render: (value) => (
        <span className="font-medium text-red-600">{value} doses</span>
      ),
    },
    {
      key: 'reason',
      title: 'Reason',
      render: (value) => (
        <Badge variant="warning">{value}</Badge>
      ),
    },
  ]
  
  const generateReport = async () => {
    try {
      setGenerating(true)
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const filteredData = getFilteredData()
      const reportContent = generateReportContent(filteredData)
      
      // Create and download CSV
      const csvContent = createCSV(filteredData)
      downloadCSV(csvContent, `${activeReport}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      
      toast.success('Report generated successfully')
    } catch (err) {
      toast.error('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }
  
  const generateReportContent = (data) => {
    switch (activeReport) {
      case 'inventory':
        return data.map(item => ({
          Vaccine: item.vaccineId,
          'Lot Number': item.lotNumber,
          Quantity: item.quantityOnHand,
          'Expiration Date': format(new Date(item.expirationDate), 'MM/dd/yyyy'),
          Location: item.location,
          Status: getInventoryStatus(item),
        }))
      
      case 'administration':
        return data.map(item => ({
          Date: format(new Date(item.administeredDate), 'MM/dd/yyyy'),
          Vaccine: item.vaccineId,
          'Lot Number': item.lotNumber,
          'Age Group': item.patientAgeGroup,
          'Doses Used': item.dosesUsed,
          Provider: item.providerId,
        }))
      
      case 'loss':
        return data.map(item => ({
          Date: format(new Date(item.reportedDate), 'MM/dd/yyyy'),
          Vaccine: item.vaccineId,
          'Lot Number': item.lotNumber,
          'Quantity Lost': item.quantity,
          Reason: item.reason,
          Details: item.details || '',
        }))
      
      default:
        return []
    }
  }
  
  const createCSV = (data) => {
    const reportContent = generateReportContent(data)
    
    if (reportContent.length === 0) {
      return 'No data available for the selected criteria.'
    }
    
    const headers = Object.keys(reportContent[0])
    const csvRows = [
      headers.join(','),
      ...reportContent.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ]
    
    return csvRows.join('\n')
  }
  
  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  const getActiveColumns = () => {
    switch (activeReport) {
      case 'inventory':
        return inventoryColumns
      case 'administration':
        return administrationColumns
      case 'loss':
        return lossColumns
      default:
        return []
    }
  }
  
  const getReportSummary = () => {
    const data = getFilteredData()
    
    switch (activeReport) {
      case 'inventory':
        return {
          total: data.length,
          expired: data.filter(item => getInventoryStatus(item) === 'expired').length,
          critical: data.filter(item => getInventoryStatus(item) === 'critical').length,
          totalDoses: data.reduce((sum, item) => sum + item.quantityOnHand, 0),
        }
      
      case 'administration':
        return {
          total: data.length,
          totalDoses: data.reduce((sum, item) => sum + item.dosesUsed, 0),
          uniqueVaccines: new Set(data.map(item => item.vaccineId)).size,
          dateRange: `${format(new Date(dateRange.startDate), 'MMM dd')} - ${format(new Date(dateRange.endDate), 'MMM dd, yyyy')}`,
        }
      
      case 'loss':
        return {
          total: data.length,
          totalDoses: data.reduce((sum, item) => sum + item.quantity, 0),
          estimatedValue: data.reduce((sum, item) => sum + (item.quantity * 50), 0),
          dateRange: `${format(new Date(dateRange.startDate), 'MMM dd')} - ${format(new Date(dateRange.endDate), 'MMM dd, yyyy')}`,
        }
      
      default:
        return {}
    }
  }
  
  // Get unique values for filters
  const uniqueVaccines = [...new Set([
    ...reportData.inventory.map(item => item.vaccineId),
    ...reportData.administrations.map(item => item.vaccineId),
    ...reportData.losses.map(item => item.vaccineId),
  ])]
  
  const uniqueLocations = [...new Set(reportData.inventory.map(item => item.location))]
  
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
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Generate comprehensive reports for inventory management
          </p>
        </div>
        <Button
          onClick={generateReport}
          loading={generating}
          disabled={generating}
          className="btn-primary"
        >
          <ApperIcon name="Download" size={16} className="mr-2" />
          Export Report
        </Button>
      </div>
      
      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all duration-200 ${
              activeReport === type.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => setActiveReport(type.id)}
          >
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activeReport === type.id 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <ApperIcon name={type.icon} size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{type.name}</h3>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Filters */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(activeReport === 'administration' || activeReport === 'loss') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vaccine Type
              </label>
              <Select
                value={filters.vaccineType}
                onChange={(e) => setFilters(prev => ({ ...prev, vaccineType: e.target.value }))}
              >
                <option value="">All vaccines</option>
                {uniqueVaccines.map(vaccine => (
                  <option key={vaccine} value={vaccine}>{vaccine}</option>
                ))}
              </Select>
            </div>
            
            {activeReport === 'inventory' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <Select
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  >
                    <option value="">All locations</option>
                    {uniqueLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All statuses</option>
                    <option value="expired">Expired</option>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="good">Good</option>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
      
      {/* Report Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(() => {
              const summary = getReportSummary()
              
              switch (activeReport) {
                case 'inventory':
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                        <div className="text-sm text-gray-500">Total Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{summary.totalDoses}</div>
                        <div className="text-sm text-gray-500">Total Doses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{summary.expired}</div>
                        <div className="text-sm text-gray-500">Expired</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{summary.critical}</div>
                        <div className="text-sm text-gray-500">Critical</div>
                      </div>
                    </>
                  )
                
                case 'administration':
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                        <div className="text-sm text-gray-500">Total Records</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{summary.totalDoses}</div>
                        <div className="text-sm text-gray-500">Doses Administered</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{summary.uniqueVaccines}</div>
                        <div className="text-sm text-gray-500">Vaccine Types</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{summary.dateRange}</div>
                        <div className="text-sm text-gray-500">Date Range</div>
                      </div>
                    </>
                  )
                
                case 'loss':
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                        <div className="text-sm text-gray-500">Total Reports</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{summary.totalDoses}</div>
                        <div className="text-sm text-gray-500">Doses Lost</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">${summary.estimatedValue?.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Estimated Value</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{summary.dateRange}</div>
                        <div className="text-sm text-gray-500">Date Range</div>
                      </div>
                    </>
                  )
                
                default:
                  return null
              }
            })()}
          </div>
        </div>
      </Card>
      
      {/* Report Data */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {reportTypes.find(type => type.id === activeReport)?.name} Data
            </h3>
            <div className="text-sm text-gray-500">
              {getFilteredData().length} records
            </div>
          </div>
          
          {getFilteredData().length > 0 ? (
            <DataTable
              columns={getActiveColumns()}
              data={getFilteredData()}
            />
          ) : (
            <Empty
              type="reports"
              title="No Data Available"
              description="No data matches your current filter criteria. Try adjusting your filters."
              actionText="Clear Filters"
              onAction={() => {
                setFilters({
                  vaccineType: '',
                  location: '',
                  status: '',
                })
                setDateRange({
                  startDate: startOfMonth(new Date()).toISOString().split('T')[0],
                  endDate: endOfMonth(new Date()).toISOString().split('T')[0],
                })
              }}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

export default Reports