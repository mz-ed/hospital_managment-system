<template>
  <div id="app" :class="{ 'dark-mode': darkMode }">
    <header>
      <div class="header-content">
        <div class="logo">
          <img src="https://img.freepik.com/vecteurs-libre/croix-medicale-vecteur-conception-logo-hopital_53876-136743.jpg" alt="Medical Logo" />
        </div>
        <h1>Patient Management System</h1>
        
        <div class="profile">
          <div class="profile-photo">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=3498db&color=fff" alt="Admin Profile">
          </div>
          <div class="profile-info">
            <span class="profile-name">Admin User</span>
            <span class="profile-role">Administrator</span>
          </div>
        </div>
        
        <button class="theme-toggle" @click="toggleDarkMode">
          <i :class="darkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>
      </div>
    </header>

    <div class="container">
      <div class="dashboard-card">
        <div class="menu">
          <button
            class="menu-item"
            :class="{ active: activeSection === 'add' }"
            @click="setActiveSection('add')"
          >
            <i class="fas fa-user-plus"></i>
            Add Patient
          </button>
          <button
            class="menu-item"
            :class="{ active: activeSection === 'view' }"
            @click="setActiveSection('view')"
          >
            <i class="fas fa-users"></i>
            Patient List
          </button>
        </div>

        <div v-if="statusMessage" :class="['status-message', statusMessageClass]">
          <i :class="statusIcon"></i>
          {{ statusMessage }}
          <button class="close-btn" @click="statusMessage = ''">×</button>
        </div>

        <div v-if="activeSection === 'add'" class="form-section">
          <h2><i class="fas fa-user-plus"></i> {{ isEditing ? 'Edit Patient' : 'Register New Patient' }}</h2>
          <form @submit.prevent="submitForm">
            <div class="form-row">
              <div class="form-group">
                <label for="name">Full Name</label>
                <div class="input-with-icon">
                  <i class="fas fa-user"></i>
                  <input 
                    v-model="patient.name" 
                    @input="clearError('name')" 
                    type="text" 
                    id="name" 
                    placeholder="Enter full name"
                    required 
                  />
                </div>
                <div v-if="errors.name" class="error"><i class="fas fa-exclamation-circle"></i> {{ errors.name }}</div>
              </div>

              <div class="form-group">
                <label for="age">Age</label>
                <div class="input-with-icon">
                  <i class="fas fa-birthday-cake"></i>
                  <input 
                    v-model.number="patient.age" 
                    @input="clearError('age')" 
                    type="number" 
                    id="age" 
                    placeholder="Enter age"
                    required min="0" max="120" 
                  />
                </div>
                <div v-if="errors.age" class="error"><i class="fas fa-exclamation-circle"></i> {{ errors.age }}</div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="gender">Gender</label>
                <div class="input-with-icon">
                  <i class="fas fa-venus-mars"></i>
                  <select 
                    v-model="patient.gender" 
                    @change="clearError('gender')" 
                    id="gender" 
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div v-if="errors.gender" class="error"><i class="fas fa-exclamation-circle"></i> {{ errors.gender }}</div>
              </div>

              <div class="form-group">
                <label for="contact">Contact Number</label>
                <div class="input-with-icon">
                  <i class="fas fa-phone"></i>
                  <input 
                    v-model="patient.contact" 
                    @input="clearError('contact')" 
                    type="tel" 
                    id="contact" 
                    placeholder="Enter phone number"
                    required 
                  />
                </div>
                <div v-if="errors.contact" class="error"><i class="fas fa-exclamation-circle"></i> {{ errors.contact }}</div>
              </div>
            </div>

            <div class="form-group">
              <label for="address">Address</label>
              <div class="input-with-icon">
                <i class="fas fa-home"></i>
                <input 
                  v-model="patient.address" 
                  @input="clearError('address')" 
                  type="text" 
                  id="address" 
                  placeholder="Enter full address"
                  required 
                />
              </div>
              <div v-if="errors.address" class="error"><i class="fas fa-exclamation-circle"></i> {{ errors.address }}</div>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" v-if="isEditing" @click="cancelEdit">
                <i class="fas fa-times"></i> Cancel
              </button>
              <button type="reset" class="reset-btn" @click="resetForm">
                <i class="fas fa-undo"></i> Reset
              </button>
              <button type="submit" class="submit-btn">
                <i class="fas fa-save"></i> {{ isEditing ? 'Update' : 'Save Patient' }}
              </button>
            </div>
          </form>
        </div>

        <div v-if="activeSection === 'view'" class="view-section">
          <h2><i class="fas fa-users"></i> Patient Records</h2>
          
          <div class="controls">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                v-model="searchQuery" 
                placeholder="Search patients..." 
                @input="handleSearch" 
              />
            </div>
            <div class="sort-controls">
              <label><i class="fas fa-sort"></i> Sort by:</label>
              <select v-model="sortField" @change="fetchPatients">
                <option value="id">ID</option>
                <option value="name">Name</option>
                <option value="age">Age</option>
                <option value="created_at">Date Added</option>
              </select>
              <select v-model="sortOrder" @change="fetchPatients">
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            </div>
          </div>
          
          <div class="table-container">
            <div v-if="loading" class="loading-overlay">
              <div class="spinner"></div>
              <p>Loading data...</p>
            </div>
            
            <table v-if="!loading && patients.length > 0">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th><i class="fas fa-id-card"></i> ID</th>
                  <th><i class="fas fa-user"></i> Name</th>
                  <th><i class="fas fa-birthday-cake"></i> Age</th>
                  <th><i class="fas fa-venus-mars"></i> Gender</th>
                  <th><i class="fas fa-phone"></i> Contact</th>
                  <th><i class="fas fa-home"></i> Address</th>
                  <th><i class="fas fa-cogs"></i> Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="patient in patients" :key="patient.id" class="patient-row">
                  <td>
                    <div class="patient-photo">
                      <img :src="getPatientPhoto(patient)" :alt="patient.name">
                    </div>
                  </td>
                  <td>{{ patient.id }}</td>
                  <td>{{ patient.name }}</td>
                  <td>{{ patient.age }}</td>
                  <td>
                    <span :class="'gender-badge ' + patient.gender.toLowerCase()">
                      {{ patient.gender }}
                    </span>
                  </td>
                  <td>{{ patient.contact }}</td>
                  <td>{{ patient.address }}</td>
                  <td class="actions">
                    <button class="action-btn edit" @click="editPatient(patient)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" @click="showDeleteConfirmation(patient)">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div v-if="!loading && patients.length === 0" class="no-data">
              <i class="fas fa-folder-open"></i>
              <p>No patient records found</p>
              <button class="add-new-btn" @click="setActiveSection('add')">
                <i class="fas fa-user-plus"></i> Add New Patient
              </button>
            </div>
            
            <div v-if="!loading && pagination.total > pagination.limit" class="pagination">
              <button 
                :disabled="pagination.page === 1" 
                @click="changePage(pagination.page - 1)"
                class="page-btn"
              >
                <i class="fas fa-chevron-left"></i> Previous
              </button>
              
              <span class="page-info">
                Page {{ pagination.page }} of {{ Math.ceil(pagination.total / pagination.limit) }}
              </span>
              
              <button 
                :disabled="pagination.page >= Math.ceil(pagination.total / pagination.limit)" 
                @click="changePage(pagination.page + 1)"
                class="page-btn"
              >
                Next <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div class="modal" v-if="deleteModal.show">
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fas fa-exclamation-triangle"></i> Delete Confirmation</h3>
            <button class="close-btn" @click="deleteModal.show = false">×</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete patient <strong>{{ deleteModal.patient?.name }}</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="deleteModal.show = false">
              <i class="fas fa-times"></i> Cancel
            </button>
            <button class="delete-btn" @click="deletePatient">
              <i class="fas fa-trash-alt"></i> Delete
            </button>
          </div>
        </div>
      </div>
      
      <footer>
        <p>© 2025 Patient Management System | All Rights Reserved</p>
      </footer>
    </div>
  </div>
</template>

<script src="../my-backend/sript.js"></script>
<style src=".\st.css"></style>
