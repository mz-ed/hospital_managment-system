
export default {
  data() {
    return {
      activeSection: 'add',
      patient: {
        id: null,
        name: '',
        age: '',
        gender: '',
        contact: '',
        address: ''
      },
      isEditing: false,
      patients: [],
      errors: {},
      statusMessage: '',
      statusMessageClass: '',
      statusIcon: '',
      loading: false,
      searchQuery: '',
      sortField: 'id',
      sortOrder: 'ASC',
      pagination: {
        page: 1,
        limit: 10,
        total: 0
      },
      searchTimeout: null,
      deleteModal: {
        show: false,
        patient: null
      },
      darkMode: false
    };
  },
  methods: {
    getPatientPhoto(patient) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`;
    },
    setActiveSection(section) {
      this.activeSection = section;
      this.statusMessage = '';
      this.errors = {};
      if (this.isEditing) {
        this.cancelEdit();
      }
      if (section === 'view') this.fetchPatients();
    },
    clearError(field) {
      if (this.errors[field]) {
        this.errors[field] = '';
      }
    },
    validateForm() {
      this.errors = {};
      let isValid = true;

      if (!this.patient.name || this.patient.name.length < 2) {
        this.errors.name = 'Please enter a valid name (min 2 characters)';
        isValid = false;
      }
      
      if (!this.patient.age || this.patient.age < 0 || this.patient.age > 120) {
        this.errors.age = 'Please enter a valid age (0-120)';
        isValid = false;
      }
      
      if (!this.patient.gender) {
        this.errors.gender = 'Please select a gender';
        isValid = false;
      }
      
      if (!this.patient.contact || this.patient.contact.length < 8) {
        this.errors.contact = 'Please enter a valid phone number (min 8 digits)';
        isValid = false;
      }
      
      if (!this.patient.address || this.patient.address.length < 5) {
        this.errors.address = 'Please enter a valid address (min 5 characters)';
        isValid = false;
      }

      return isValid;
    },
    resetForm() {
      this.patient = {
        id: null,
        name: '',
        age: '',
        gender: '',
        contact: '',
        address: ''
      };
      this.errors = {};
      this.isEditing = false;
    },
    async submitForm() {
      if (!this.validateForm()) return;

      try {
        this.loading = true;
        const url = 'http://localhost:3000/api/patients' + (this.isEditing ? `/${this.patient.id}` : '');
        const method = this.isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.patient)
        });

        const data = await response.json();

        if (response.ok) {
          this.statusMessage = this.isEditing 
            ? 'Patient updated successfully!' 
            : 'Patient added successfully!';
          this.statusMessageClass = 'status-success';
          this.statusIcon = 'fas fa-check-circle';
          
          this.resetForm();
          
          if (this.activeSection === 'view') {
            this.fetchPatients();
          }
        } else {
          this.statusMessage = data.error || 'Operation failed';
          this.statusMessageClass = 'status-error';
          this.statusIcon = 'fas fa-times-circle';
        }
      } catch (error) {
        this.statusMessage = 'Error: ' + error.message;
        this.statusMessageClass = 'status-error';
        this.statusIcon = 'fas fa-times-circle';
      } finally {
        this.loading = false;
      }
    },
    async fetchPatients() {
      this.loading = true;
      try {
        const url = new URL('http://localhost:3000/api/patients');
        url.searchParams.append('sort', this.sortField);
        url.searchParams.append('order', this.sortOrder);
        url.searchParams.append('page', this.pagination.page);
        url.searchParams.append('limit', this.pagination.limit);
        
        if (this.searchQuery) {
          url.searchParams.append('search', this.searchQuery);
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response error');
        
        const data = await response.json();
        this.patients = data.data || data;
        
        if (data.pagination) {
          this.pagination = {
            ...this.pagination,
            ...data.pagination
          };
        } else if (Array.isArray(data)) {
          this.pagination.total = data.length;
        }
      } catch (error) {
        this.statusMessage = 'Error loading patients: ' + error.message;
        this.statusMessageClass = 'status-error';
        this.statusIcon = 'fas fa-times-circle';
        this.patients = [];
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.pagination.page = 1;
        this.fetchPatients();
      }, 300);
    },
    changePage(page) {
      this.pagination.page = page;
      this.fetchPatients();
    },
    editPatient(patient) {
      this.isEditing = true;
      this.patient = { ...patient };
      this.setActiveSection('add');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    cancelEdit() {
      this.isEditing = false;
      this.resetForm();
    },
    showDeleteConfirmation(patient) {
      this.deleteModal.patient = patient;
      this.deleteModal.show = true;
    },
    async deletePatient() {
      if (!this.deleteModal.patient) return;
      
      try {
        this.loading = true;
        const response = await fetch(`http://localhost:3000/api/patients/${this.deleteModal.patient.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          this.statusMessage = 'Patient deleted successfully!';
          this.statusMessageClass = 'status-success';
          this.statusIcon = 'fas fa-check-circle';
          this.fetchPatients();
        } else {
          const data = await response.json();
          this.statusMessage = data.error || 'Delete failed';
          this.statusMessageClass = 'status-error';
          this.statusIcon = 'fas fa-times-circle';
        }
      } catch (error) {
        this.statusMessage = 'Error deleting patient: ' + error.message;
        this.statusMessageClass = 'status-error';
        this.statusIcon = 'fas fa-times-circle';
      } finally {
        this.loading = false;
        this.deleteModal.show = false;
        this.deleteModal.patient = null;
      }
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
    },
    checkDarkModePreference() {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        this.darkMode = savedMode === 'true';
      } else {
        this.darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    }
  },
  mounted() {
    this.setActiveSection('add');
    if (!document.getElementById('fontawesome-css')) {
      const link = document.createElement('link');
      link.id = 'fontawesome-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      document.head.appendChild(link);
    }
    this.checkDarkModePreference();
  }
};
