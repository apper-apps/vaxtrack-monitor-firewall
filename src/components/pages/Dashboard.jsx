import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ApperIcon from '@/components/ApperIcon'
import MetricCard from '@/components/molecules/MetricCard'
import DataTable from '@/components/molecules/DataTable'
import StatusAlert from '@/components/molecules/StatusAlert'
import Button from '@/components/atoms/Button'
import Badge from '@/components/atoms/Badge'
import Card from '@/components/atoms/Card'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import { inventoryService } from '@/services/api/inventoryService'
import { administrationService } from '@/services/api/administrationService'
import { format, isWithinInterval, subDays, addDays } from 'date-fns'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalVaccines: 0,
    totalDoses: 0,
    expiringVaccines: 0,
    lowStockItems: 0,
    recentAdministrations: [],
    expiringItems: [],
    lowStockAlerts: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get inventory data
      const inventoryData = await inventoryService.getAll()
      const administrationData = await administrationService.getAll()
      
      // Calculate metrics
      const totalVaccines = inventoryData.length
      const totalDoses = inventoryData.reduce((sum, item) => sum + item.quantityOnHand, 0)
      
      // Find expiring vaccines (within 30 days)
      const thirtyDaysFromNow = addDays(new Date(), 30)
      const expiringItems = inventoryData.filter(item => 
        new Date(item.expirationDate) <= thirtyDaysFromNow
      )
      const expiringVaccines = expiringItems.length
      
      // Find low stock items (less than 10 doses)
      const lowStockAlerts = inventoryData.filter(item => item.quantityOnHand < 10)
      const lowStockItems = lowStockAlerts.length
      
      // Get recent administrations (last 7 days)
      const sevenDaysAgo = subDays(new Date(), 7)
      const recentAdministrations = administrationData
        .filter(admin => new Date(admin.administeredDate) >= sevenDaysAgo)
        .sort((a, b) => new Date(b.administeredDate) - new Date(a.administeredDate))
        .slice(0, 5)
      
      setDashboardData({
        totalVaccines,
        totalDoses,
        expiringVaccines,
        lowStockItems,
        recentAdministrations,
        expiringItems: expiringItems.slice(0, 5),
        lowStockAlerts: lowStockAlerts.slice(0, 5),
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadDashboardData()
  }, [])
  
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }
  
  const getDaysUntilExpiration = (expirationDate) => {
    const today = new Date()
    const expDate = new Date(expirationDate)
    const diffTime = expDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  const getExpirationBadge = (expirationDate) => {
    const daysUntilExpiration = getDaysUntilExpiration(expirationDate)
    
    if (daysUntilExpiration < 0) {
      return <Badge variant="error">Expired</Badge>
    } else if (daysUntilExpiration <= 7) {
      return <Badge variant="error">Expires in {daysUntilExpiration} days</Badge>
    } else if (daysUntilExpiration <= 30) {
      return <Badge variant="warning">Expires in {daysUntilExpiration} days</Badge>
    } else {
      return <Badge variant="success">Good</Badge>
    }
  }
  
  const expiringColumns = [
    {
      key: 'lotNumber',
      title: 'Lot Number',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'vaccineId',
      title: 'Vaccine',
      render: (value) => (
        <span className="text-gray-600">{value}</span>
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
      title: 'Expiration',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">{formatDate(value)}</span>
          {getExpirationBadge(value)}
        </div>
      ),
    },
  ]
  
  const recentAdminColumns = [
    {
      key: 'administeredDate',
      title: 'Date',
      render: (value) => (
        <span className="text-gray-600">{formatDate(value)}</span>
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
      key: 'patientAgeGroup',
      title: 'Age Group',
      render: (value) => (
        <Badge variant="info">{value}</Badge>
      ),
    },
    {
      key: 'dosesUsed',
      title: 'Doses',
      render: (value) => (
        <span className="font-medium">{value}</span>
      ),
    },
  ]
  
  if (loading) {
    return <Loading type="cards" />
  }
  
  if (error) {
    return <Error message={error} onRetry={loadDashboardData} />
  }
  
  return (
    <div className="space-y-6">
      {/* Alert Section */}
      <div className="space-y-4">
        {dashboardData.expiringVaccines > 0 && (
          <StatusAlert
            type="warning"
            title="Vaccines Expiring Soon"
            message={`${dashboardData.expiringVaccines} vaccine lots are expiring within 30 days. Review and prioritize administration.`}
            actionText="View Details"
            onAction={() => window.location.href = '/inventory'}
          />
        )}
        
        {dashboardData.lowStockItems > 0 && (
          <StatusAlert
            type="error"
            title="Low Stock Alert"
            message={`${dashboardData.lowStockItems} vaccine types are below minimum stock levels. Consider reordering.`}
            actionText="View Inventory"
            onAction={() => window.location.href = '/inventory'}
          />
        )}
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Vaccines"
          value={dashboardData.totalVaccines}
          icon="Package"
          color="primary"
        />
        <MetricCard
          title="Total Doses"
          value={dashboardData.totalDoses}
          icon="Syringe"
          color="success"
        />
        <MetricCard
          title="Expiring Soon"
          value={dashboardData.expiringVaccines}
          icon="AlertTriangle"
          color="warning"
        />
        <MetricCard
          title="Low Stock"
          value={dashboardData.lowStockItems}
          icon="AlertCircle"
          color="error"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Vaccines */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Expiring Vaccines
              </h3>
              <Link to="/inventory">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            
            {dashboardData.expiringItems.length > 0 ? (
              <DataTable
                columns={expiringColumns}
                data={dashboardData.expiringItems}
                sortable={false}
              />
            ) : (
              <Empty
                type="inventory"
                title="No Expiring Vaccines"
                description="Great news! No vaccines are expiring soon."
                icon="CheckCircle"
              />
            )}
          </div>
        </Card>
        
        {/* Recent Administrations */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Administrations
              </h3>
              <Link to="/administration">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            
            {dashboardData.recentAdministrations.length > 0 ? (
              <DataTable
                columns={recentAdminColumns}
                data={dashboardData.recentAdministrations}
                sortable={false}
              />
            ) : (
              <Empty
                type="administration"
                title="No Recent Administrations"
                description="No vaccine doses have been administered in the last 7 days."
                icon="Syringe"
              />
            )}
          </div>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/receiving">
              <Button className="w-full justify-start" variant="outline">
                <ApperIcon name="Truck" size={20} className="mr-3" />
                Receive Vaccines
              </Button>
            </Link>
            <Link to="/administration">
              <Button className="w-full justify-start" variant="outline">
                <ApperIcon name="Syringe" size={20} className="mr-3" />
                Record Administration
              </Button>
            </Link>
            <Link to="/reconciliation">
              <Button className="w-full justify-start" variant="outline">
                <ApperIcon name="Calculator" size={20} className="mr-3" />
                Monthly Reconciliation
              </Button>
            </Link>
            <Link to="/reports">
              <Button className="w-full justify-start" variant="outline">
                <ApperIcon name="FileText" size={20} className="mr-3" />
                Generate Reports
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard