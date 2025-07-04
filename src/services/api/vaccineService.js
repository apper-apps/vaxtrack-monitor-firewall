// Mock vaccine service for development
export const vaccineService = {
  // Get all vaccine types
  async getAll() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            name: 'COVID-19 Pfizer',
            manufacturer: 'Pfizer-BioNTech',
            vaccineFamily: 'COVID-19',
            storageRequirements: 'Ultra-low temperature (-70°C)',
            dosesPerVial: 6,
            ageGroups: ['12-18 years', '18-65 years', '65+ years'],
            routeOfAdministration: 'Intramuscular',
            siteOfAdministration: 'Deltoid muscle',
            dosageVolume: '0.3 mL',
            isActive: true
          },
          {
            id: 2,
            name: 'Influenza Quad',
            manufacturer: 'Sanofi',
            vaccineFamily: 'Influenza',
            storageRequirements: 'Refrigerated (2-8°C)',
            dosesPerVial: 10,
            ageGroups: ['6-12 months', '1-2 years', '2-5 years', '5-12 years', '12-18 years', '18-65 years', '65+ years'],
            routeOfAdministration: 'Intramuscular',
            siteOfAdministration: 'Deltoid muscle',
            dosageVolume: '0.5 mL',
            isActive: true
          },
          {
            id: 3,
            name: 'Hepatitis B',
            manufacturer: 'GSK',
            vaccineFamily: 'Hepatitis',
            storageRequirements: 'Refrigerated (2-8°C)',
            dosesPerVial: 1,
            ageGroups: ['0-6 months', '6-12 months', '1-2 years', '2-5 years', '5-12 years', '12-18 years', '18-65 years'],
            routeOfAdministration: 'Intramuscular',
            siteOfAdministration: 'Deltoid muscle',
            dosageVolume: '0.5 mL',
            isActive: true
          },
          {
            id: 4,
            name: 'MMR',
            manufacturer: 'Merck',
            vaccineFamily: 'MMR',
            storageRequirements: 'Refrigerated (2-8°C)',
            dosesPerVial: 10,
            ageGroups: ['1-2 years', '2-5 years', '5-12 years', '12-18 years'],
            routeOfAdministration: 'Subcutaneous',
            siteOfAdministration: 'Upper arm',
            dosageVolume: '0.5 mL',
            isActive: true
          },
          {
            id: 5,
            name: 'Tdap',
            manufacturer: 'Boehringer Ingelheim',
            vaccineFamily: 'Tetanus',
            storageRequirements: 'Refrigerated (2-8°C)',
            dosesPerVial: 5,
            ageGroups: ['2-5 years', '5-12 years', '12-18 years', '18-65 years', '65+ years'],
            routeOfAdministration: 'Intramuscular',
            siteOfAdministration: 'Deltoid muscle',
            dosageVolume: '0.5 mL',
            isActive: true
          }
        ]);
      }, 500);
    });
  },

  // Get vaccine by ID
  async getById(id) {
    const vaccines = await this.getAll();
    const vaccine = vaccines.find(vaccine => vaccine.id === id);
    if (!vaccine) {
      throw new Error(`Vaccine with ID ${id} not found`);
    }
    return vaccine;
  },

  // Get vaccines by family
  async getByFamily(family) {
    const vaccines = await this.getAll();
    return vaccines.filter(vaccine => vaccine.vaccineFamily === family);
  },

  // Get active vaccines
  async getActive() {
    const vaccines = await this.getAll();
    return vaccines.filter(vaccine => vaccine.isActive);
  },

  // Get vaccine families
  async getFamilies() {
    const vaccines = await this.getAll();
    const families = [...new Set(vaccines.map(vaccine => vaccine.vaccineFamily))];
    return families.sort();
  },

  // Get manufacturers
  async getManufacturers() {
    const vaccines = await this.getAll();
    const manufacturers = [...new Set(vaccines.map(vaccine => vaccine.manufacturer))];
    return manufacturers.sort();
  },

  // Create new vaccine
  async create(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!data.name || !data.manufacturer || !data.vaccineFamily) {
          reject(new Error('Missing required fields'));
          return;
        }
        
        const newVaccine = {
          id: Date.now(),
          ...data,
          isActive: data.isActive !== undefined ? data.isActive : true
        };
        
        resolve(newVaccine);
      }, 300);
    });
  },

  // Update vaccine
  async update(id, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject(new Error('ID is required'));
          return;
        }
        
        const updatedVaccine = {
          id,
          ...data
        };
        
        resolve(updatedVaccine);
      }, 300);
    });
  },

  // Delete vaccine
  async delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!id) {
          reject(new Error('ID is required'));
          return;
        }
        resolve({ message: 'Vaccine deleted successfully' });
      }, 300);
    });
  }
};