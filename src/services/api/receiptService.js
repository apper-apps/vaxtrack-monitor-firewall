// Mock receipt service for development
export const receiptService = {
  // Get all receipt records
  async getAll() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            receivedDate: '2024-01-15',
            vaccineId: 'COVID-19 Pfizer',
            lotNumber: 'PF001',
            quantitySent: 300,
            quantityReceived: 295,
            dosesPassed: 290,
            dosesFailed: 5,
            supplier: 'Pfizer Inc.',
            shipmentId: 'SHIP001',
            receivedBy: 'John Smith',
            temperature: '-70°C',
            status: 'completed'
          },
          {
            id: 2,
            receivedDate: '2024-01-14',
            vaccineId: 'Influenza Quad',
            lotNumber: 'FLU002',
            quantitySent: 200,
            quantityReceived: 200,
            dosesPassed: 195,
            dosesFailed: 5,
            supplier: 'Sanofi',
            shipmentId: 'SHIP002',
            receivedBy: 'Jane Doe',
            temperature: '2-8°C',
            status: 'completed'
          },
          {
            id: 3,
            receivedDate: '2024-01-13',
            vaccineId: 'Hepatitis B',
            lotNumber: 'HEP003',
            quantitySent: 100,
            quantityReceived: 98,
            dosesPassed: 96,
            dosesFailed: 2,
            supplier: 'GSK',
            shipmentId: 'SHIP003',
            receivedBy: 'Mike Johnson',
            temperature: '2-8°C',
            status: 'completed'
          },
          {
            id: 4,
            receivedDate: '2024-01-12',
            vaccineId: 'MMR',
            lotNumber: 'MMR004',
            quantitySent: 250,
            quantityReceived: 250,
            dosesPassed: 245,
            dosesFailed: 5,
            supplier: 'Merck',
            shipmentId: 'SHIP004',
            receivedBy: 'Sarah Wilson',
            temperature: '2-8°C',
            status: 'completed'
          },
          {
            id: 5,
            receivedDate: '2024-01-11',
            vaccineId: 'Tdap',
            lotNumber: 'TDA005',
            quantitySent: 150,
            quantityReceived: 145,
            dosesPassed: 140,
            dosesFailed: 5,
            supplier: 'Boehringer Ingelheim',
            shipmentId: 'SHIP005',
            receivedBy: 'David Brown',
            temperature: '2-8°C',
            status: 'pending'
          }
        ]);
      }, 500);
    });
  },

  // Get receipt by ID
  async getById(id) {
    const receipts = await this.getAll();
    const receipt = receipts.find(receipt => receipt.id === id);
    if (!receipt) {
      throw new Error(`Receipt with ID ${id} not found`);
    }
    return receipt;
  },

  // Create new receipt record
  async create(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!data.vaccineId || !data.lotNumber || !data.quantitySent) {
          reject(new Error('Missing required fields'));
          return;
        }
        
        const newReceipt = {
          id: Date.now(),
          ...data,
          receivedDate: data.receivedDate || new Date().toISOString().split('T')[0],
          status: data.status || 'pending'
        };
        
        resolve(newReceipt);
      }, 300);
    });
  },

  // Update receipt record
  async update(id, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject(new Error('ID is required'));
          return;
        }
        
        const updatedReceipt = {
          id,
          ...data
        };
        
        resolve(updatedReceipt);
      }, 300);
    });
  },

  // Delete receipt record
  async delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject(new Error('ID is required'));
          return;
        }
        resolve({ message: 'Receipt record deleted successfully' });
      }, 300);
    });
  },

  // Get receipts by status
  async getByStatus(status) {
    const receipts = await this.getAll();
    return receipts.filter(receipt => receipt.status === status);
  },

  // Get summary statistics
  async getSummary() {
    const receipts = await this.getAll();
    const totalSent = receipts.reduce((sum, receipt) => sum + receipt.quantitySent, 0);
    const totalReceived = receipts.reduce((sum, receipt) => sum + receipt.quantityReceived, 0);
    const totalPassed = receipts.reduce((sum, receipt) => sum + receipt.dosesPassed, 0);
    const totalFailed = receipts.reduce((sum, receipt) => sum + receipt.dosesFailed, 0);
    
    return {
      totalSent,
      totalReceived,
      totalPassed,
      totalFailed,
      discrepancyRate: ((totalSent - totalReceived) / totalSent * 100).toFixed(2),
      failureRate: (totalFailed / totalReceived * 100).toFixed(2)
    };
  }
};