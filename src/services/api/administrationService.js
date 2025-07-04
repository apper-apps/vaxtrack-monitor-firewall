// Mock administration service for development
export const administrationService = {
  // Get all administration records
  async getAll() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            administeredDate: '2024-01-15',
            vaccineId: 'COVID-19 Pfizer',
            lotNumber: 'PF001',
            dosesUsed: 5,
            patientAgeGroup: '18-65 years',
            administeredBy: 'Dr. Smith',
            location: 'Clinic A'
          },
          {
            id: 2,
            administeredDate: '2024-01-14',
            vaccineId: 'Influenza Quad',
            lotNumber: 'FLU002',
            dosesUsed: 3,
            patientAgeGroup: '65+ years',
            administeredBy: 'Nurse Johnson',
            location: 'Clinic B'
          },
          {
            id: 3,
            administeredDate: '2024-01-13',
            vaccineId: 'Hepatitis B',
            lotNumber: 'HEP003',
            dosesUsed: 2,
            patientAgeGroup: '12-18 years',
            administeredBy: 'Dr. Wilson',
            location: 'Clinic A'
          },
          {
            id: 4,
            administeredDate: '2024-01-12',
            vaccineId: 'MMR',
            lotNumber: 'MMR004',
            dosesUsed: 4,
            patientAgeGroup: '1-2 years',
            administeredBy: 'Nurse Davis',
            location: 'Clinic C'
          },
          {
            id: 5,
            administeredDate: '2024-01-11',
            vaccineId: 'Tdap',
            lotNumber: 'TDA005',
            dosesUsed: 1,
            patientAgeGroup: '5-12 years',
            administeredBy: 'Dr. Brown',
            location: 'Clinic B'
          }
        ]);
      }, 500);
    });
  },

  // Get administration records by date range
  async getByDateRange(startDate, endDate) {
    const records = await this.getAll();
    return records.filter(record => {
      const recordDate = new Date(record.administeredDate);
      return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
    });
  },

  // Create new administration record
  async create(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!data.vaccineId || !data.lotNumber || !data.dosesUsed) {
          reject(new Error('Missing required fields'));
          return;
        }
        
        const newRecord = {
          id: Date.now(),
          ...data,
          administeredDate: data.administeredDate || new Date().toISOString().split('T')[0]
        };
        
        resolve(newRecord);
      }, 300);
    });
  },

  // Update administration record
  async update(id, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject(new Error('ID is required'));
          return;
        }
        
        const updatedRecord = {
          id,
          ...data
        };
        
        resolve(updatedRecord);
      }, 300);
    });
  },

  // Delete administration record
  async delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject(new Error('ID is required'));
          return;
        }
        resolve({ message: 'Administration record deleted successfully' });
      }, 300);
    });
  },

  // Get summary statistics
  async getSummary() {
    const records = await this.getAll();
    const totalDoses = records.reduce((sum, record) => sum + record.dosesUsed, 0);
    const uniqueVaccines = [...new Set(records.map(record => record.vaccineId))];
    
    return {
      totalDoses,
      totalRecords: records.length,
      uniqueVaccines: uniqueVaccines.length,
      averageDosesPerRecord: totalDoses / records.length || 0
    };
  }
};