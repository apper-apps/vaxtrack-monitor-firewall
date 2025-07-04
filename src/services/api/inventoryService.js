// Mock inventory service for development
export const inventoryService = {
  // Get all inventory items
  async getAll() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            vaccineId: 'COVID-19 Pfizer',
            lotNumber: 'PF001',
            quantityOnHand: 250,
            expirationDate: '2024-12-31',
            location: 'Freezer A',
            lastUpdated: '2024-01-15',
            minimumStock: 50,
            vaccineFamily: 'COVID-19'
          },
          {
            id: 2,
            vaccineId: 'Influenza Quad',
            lotNumber: 'FLU002',
            quantityOnHand: 150,
            expirationDate: '2024-10-31',
            location: 'Refrigerator B',
            lastUpdated: '2024-01-14',
            minimumStock: 100,
            vaccineFamily: 'Influenza'
          },
          {
            id: 3,
            vaccineId: 'Hepatitis B',
            lotNumber: 'HEP003',
            quantityOnHand: 75,
            expirationDate: '2024-08-15',
            location: 'Refrigerator A',
            lastUpdated: '2024-01-13',
            minimumStock: 25,
            vaccineFamily: 'Hepatitis'
          },
          {
            id: 4,
            vaccineId: 'MMR',
            lotNumber: 'MMR004',
            quantityOnHand: 200,
            expirationDate: '2024-11-30',
            location: 'Refrigerator B',
            lastUpdated: '2024-01-12',
            minimumStock: 50,
            vaccineFamily: 'MMR'
          },
          {
            id: 5,
            vaccineId: 'Tdap',
            lotNumber: 'TDA005',
            quantityOnHand: 30,
            expirationDate: '2024-09-30',
            location: 'Refrigerator A',
            lastUpdated: '2024-01-11',
            minimumStock: 40,
            vaccineFamily: 'Tetanus'
          }
        ]);
      }, 500);
    });
  },

  // Get inventory by ID
  async getById(id) {
    const items = await this.getAll();
    const item = items.find(item => item.id === id);
    if (!item) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }
    return item;
  },

  // Create new inventory item
  async create(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!data.vaccineId || !data.lotNumber || !data.quantityOnHand) {
          reject(new Error('Missing required fields'));
          return;
        }
        
        const newItem = {
          id: Date.now(),
          ...data,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        resolve(newItem);
      }, 300);
    });
  },

  // Update inventory item
  async update(id, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject(new Error('ID is required'));
          return;
        }
        
        const updatedItem = {
          id,
          ...data,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        resolve(updatedItem);
      }, 300);
    });
  },

  // Delete inventory item
  async delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject(new Error('ID is required'));
          return;
        }
        resolve({ message: 'Item deleted successfully' });
      }, 300);
    });
  },

  // Get low stock items
  async getLowStock() {
    const items = await this.getAll();
    return items.filter(item => item.quantityOnHand <= item.minimumStock);
  },

  // Get expiring items
  async getExpiring(days = 30) {
    const items = await this.getAll();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return items.filter(item => {
      const expirationDate = new Date(item.expirationDate);
      return expirationDate <= cutoffDate;
    });
  }
};