// Mock loss service for development
export const lossService = {
  // Get all loss records
  async getAll() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            reportedDate: '2024-01-15',
            vaccineId: 'COVID-19 Pfizer',
            lotNumber: 'PF001',
            quantity: 5,
            reason: 'Expired',
            value: 150.00,
            reportedBy: 'John Smith',
            description: 'Vaccines expired due to power outage',
            trainingCompleted: true,
            location: 'Freezer A',
            wastageType: 'Preventable'
          },
          {
            id: 2,
            reportedDate: '2024-01-14',
            vaccineId: 'Influenza Quad',
            lotNumber: 'FLU002',
            quantity: 3,
            reason: 'Broken vial',
            value: 45.00,
            reportedBy: 'Jane Doe',
            description: 'Vial accidentally dropped during transport',
            trainingCompleted: true,
            location: 'Refrigerator B',
            wastageType: 'Preventable'
          },
          {
            id: 3,
            reportedDate: '2024-01-13',
            vaccineId: 'Hepatitis B',
            lotNumber: 'HEP003',
            quantity: 2,
            reason: 'Temperature excursion',
            value: 80.00,
            reportedBy: 'Mike Johnson',
            description: 'Refrigerator temperature exceeded acceptable range',
            trainingCompleted: false,
            location: 'Refrigerator A',
            wastageType: 'Non-preventable'
          },
          {
            id: 4,
            reportedDate: '2024-01-12',
            vaccineId: 'MMR',
            lotNumber: 'MMR004',
            quantity: 1,
            reason: 'Drawn up but not used',
            value: 25.00,
            reportedBy: 'Sarah Wilson',
            description: 'Patient did not show up for appointment',
            trainingCompleted: true,
            location: 'Clinic A',
            wastageType: 'Non-preventable'
          },
          {
            id: 5,
            reportedDate: '2024-01-11',
            vaccineId: 'Tdap',
            lotNumber: 'TDA005',
            quantity: 4,
            reason: 'Equipment failure',
            value: 100.00,
            reportedBy: 'David Brown',
            description: 'Refrigerator compressor failed overnight',
            trainingCompleted: true,
            location: 'Refrigerator B',
            wastageType: 'Non-preventable'
          }
        ]);
      }, 500);
    });
  },

  // Get loss record by ID
  async getById(id) {
    const losses = await this.getAll();
    const loss = losses.find(loss => loss.id === id);
    if (!loss) {
      throw new Error(`Loss record with ID ${id} not found`);
    }
    return loss;
  },

  // Create new loss record
  async create(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!data.vaccineId || !data.lotNumber || !data.quantity || !data.reason) {
          reject(new Error('Missing required fields'));
          return;
        }
        
        const newLoss = {
          id: Date.now(),
          ...data,
          reportedDate: data.reportedDate || new Date().toISOString().split('T')[0],
          trainingCompleted: data.trainingCompleted || false,
          wastageType: data.wastageType || 'Unknown'
        };
        
        resolve(newLoss);
      }, 300);
    });
  },

  // Update loss record
  async update(id, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject(new Error('ID is required'));
          return;
        }
        
        const updatedLoss = {
          id,
          ...data
        };
        
        resolve(updatedLoss);
      }, 300);
    });
  },

  // Delete loss record
  async delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject(new Error('ID is required'));
          return;
        }
        resolve({ message: 'Loss record deleted successfully' });
      }, 300);
    });
  },

  // Get losses by reason
  async getByReason(reason) {
    const losses = await this.getAll();
    return losses.filter(loss => loss.reason === reason);
  },

  // Get losses by date range
  async getByDateRange(startDate, endDate) {
    const losses = await this.getAll();
    return losses.filter(loss => {
      const lossDate = new Date(loss.reportedDate);
      return lossDate >= new Date(startDate) && lossDate <= new Date(endDate);
    });
  },

  // Get summary statistics
  async getSummary() {
    const losses = await this.getAll();
    const totalQuantity = losses.reduce((sum, loss) => sum + loss.quantity, 0);
    const totalValue = losses.reduce((sum, loss) => sum + (loss.value || 0), 0);
    const preventableLosses = losses.filter(loss => loss.wastageType === 'Preventable');
    const nonPreventableLosses = losses.filter(loss => loss.wastageType === 'Non-preventable');
    
    return {
      totalQuantity,
      totalValue,
      totalRecords: losses.length,
      preventableLosses: preventableLosses.length,
      nonPreventableLosses: nonPreventableLosses.length,
      preventableValue: preventableLosses.reduce((sum, loss) => sum + (loss.value || 0), 0),
      nonPreventableValue: nonPreventableLosses.reduce((sum, loss) => sum + (loss.value || 0), 0)
    };
  },

  // Get loss reasons
  async getReasons() {
    return [
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
      'Other'
    ];
  }
};