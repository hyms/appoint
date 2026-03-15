<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick">
        <span class="text-overline font-weight-black letter-spacing-1">USER MANAGEMENT</span>
    </v-card-title>
    <v-card-text>
        <v-alert type="warning" variant="tonal" rounded="md" class="mb-6">
            User management allows Administrators to create, edit, suspend, and assign roles to system users (Patients, Professionals, Secretaries).
        </v-alert>

        <v-row class="mb-4">
            <v-col cols="12" sm="6" md="3">
                <BaseSelect
                    v-model="filters.role"
                    label="Filter by Role"
                    :items="roleOptions"
                    item-title="text"
                    item-value="value"
                    hide-details
                    @update:model-value="$emit('updateList')"
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <BaseSelect
                    v-model="filters.isActive"
                    label="Status"
                    :items="activeOptions"
                    item-title="text"
                    item-value="value"
                    hide-details
                    @update:model-value="$emit('updateList')"
                />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center justify-end gap-2 pt-3 pt-md-0">
                <BaseButton color="primary" variant="text" prepend-icon="mdi-plus" @click="$emit('openUserDialog')">
                    New User
                </BaseButton>
                <BaseButton color="primary" variant="text" prepend-icon="mdi-refresh" @click="$emit('updateList')" />
            </v-col>
        </v-row>
        
        <v-data-table
            :headers="headers"
            :items="users"
            :loading="loading"
            :items-per-page="10"
            class="data-table-industrial"
        >
            <template v-slot:item.profile.firstName="{ item }">
                {{ item.profile?.firstName }} {{ item.profile?.lastName }}
            </template>
            <template v-slot:item.role="{ item }">
                <v-chip :color="getRoleColor(item.role)" size="small">
                  {{ item.role }}
                </v-chip>
            </template>
            <template v-slot:item.isActive="{ item }">
                <v-chip :color="item.isActive ? 'success' : 'error'" size="small">
                  {{ item.isActive ? 'Active' : 'Inactive' }}
                </v-chip>
            </template>
            <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
            </template>
            <template v-slot:item.actions="{ item }">
                <v-btn size="small" color="primary" variant="text" @click="$emit('openUserDialog', item)">
                  Edit
                </v-btn>
                <v-btn size="small" color="error" variant="text" icon="mdi-delete" @click="$emit('deleteUser', item)" />
            </template>
        </v-data-table>
    </v-card-text>

    <v-dialog v-model="userDialog" max-width="600">
      <v-card>
        <v-card-title>{{ editingUser ? 'Edit User' : 'Create New User' }}</v-card-title>
        <v-card-text>
          <v-form ref="userFormRef" @submit.prevent="saveUser">
            <BaseInput v-model="userFormData.email" label="Email" required :rules="emailRules" variant="outlined" rounded="md" />
            <BaseInput v-if="!editingUser" v-model="userFormData.password" label="Password" type="password" required :rules="passwordRules" variant="outlined" rounded="md" />
            <BaseInput v-model="userFormData.phone" label="Phone" type="tel" variant="outlined" rounded="md" />
            <BaseInput v-model="userFormData.firstName" label="First Name" required :rules="[(v: string) => !!v || 'Name required']" variant="outlined" rounded="md" />
            <BaseInput v-model="userFormData.lastName" label="Last Name" required :rules="[(v: string) => !!v || 'Last name required']" variant="outlined" rounded="md" />
            <BaseInput v-model="userFormData.dni" label="DNI" variant="outlined" rounded="md" />
            <BaseSelect v-model="userFormData.role" label="Role" :items="roleOptions" item-title="text" item-value="value" required :rules="[(v: string) => !!v || 'Role required']" />
            <v-switch v-if="editingUser" v-model="userFormData.isActive" label="User Active" color="success" inset />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <BaseButton variant="text" @click="userDialog = false">Cancel</BaseButton>
          <BaseButton color="primary" @click="saveUser" :loading="savingUser">
            {{ editingUser ? 'Update' : 'Create' }}
          </BaseButton>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { usersService, type User, type UpdateUserDto, type CreateUserDto } from '@/services/users'
import api from '@/services/api'
import { formatDate } from '@/utils/date'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'

const { success, error } = useToast()

const props = defineProps<{
    modelValue: { role: string, isActive: boolean | undefined }
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void
    (e: 'updateList'): void
    (e: 'openUserDialog', user?: User): void
    (e: 'deleteUser', user: User): void
}>()

import { reactive } from 'vue'

const loading = ref(false)
const savingUser = ref(false)
const userDialog = ref(false)
const editingUser = ref<User | null>(null)
const userFormRef = ref()

const users = ref<User[]>([])

const filters = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const roleOptions = [
  { text: 'Administrator', value: 'ADMIN' },
  { text: 'Secretary', value: 'SECRETARY' },
  { text: 'Professional', value: 'PROFESSIONAL' },
  { text: 'Patient', value: 'PATIENT' }
]
const activeOptions = [
  { text: 'Active', value: true },
  { text: 'Inactive', value: false }
]

const headers = [
  { title: 'Name', key: 'profile.firstName' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Role', key: 'role' },
  { title: 'Status', key: 'isActive' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const userFormData = reactive<{
  email: string
  password?: string
  phone: string
  firstName: string
  lastName: string
  dni: string
  role: string
  isActive: boolean
}>({
  email: '',
  password: '',
  phone: '',
  firstName: '',
  lastName: '',
  dni: '',
  role: 'PATIENT',
  isActive: true
})

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email must be valid',
]
const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
]


function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    ADMIN: 'purple',
    SECRETARY: 'blue',
    PROFESSIONAL: 'green',
    PATIENT: 'orange'
  }
  return colors[role] || 'grey'
}

async function fetchUsers() {
    loading.value = true
    try {
        const params: any = {}
        if (filters.value.role) params.role = filters.value.role
        if (filters.value.isActive !== undefined) params.isActive = filters.value.isActive
        users.value = await usersService.getAll(params)
    } catch (e) {
        error('Failed to load users')
        console.error(e)
    } finally {
        loading.value = false
    }
}

function openUserDialog(user?: User) {
  if (user) {
    editingUser.value = user
    userFormData.email = user.email
    userFormData.password = ''
    userFormData.phone = user.phone || ''
    userFormData.firstName = user.profile?.firstName || ''
    userFormData.lastName = user.profile?.lastName || ''
    userFormData.dni = user.profile?.dni || ''
    userFormData.role = user.role
    userFormData.isActive = user.isActive
  } else {
    editingUser.value = null
    userFormData.email = ''
    userFormData.password = ''
    userFormData.phone = ''
    userFormData.firstName = ''
    userFormData.lastName = ''
    userFormData.dni = ''
    userFormData.role = 'PATIENT'
    userFormData.isActive = true
  }
  userDialog.value = true
}

async function saveUser() {
  if (!userFormRef.value?.validate()) return
  
  savingUser.value = true
  try {
    if (editingUser.value) {
      const updateData: UpdateUserDto = {
        email: userFormData.email,
        phone: userFormData.phone,
        firstName: userFormData.firstName,
        lastName: userFormData.lastName,
        dni: userFormData.dni,
        role: userFormData.role,
        isActive: userFormData.isActive
      }
      await usersService.update(editingUser.value.id, updateData)
      success('User updated successfully')
    } else {
      if (!userFormData.password) {
        error('Password is required for new user creation.')
        savingUser.value = false
        return
      }
      const createData: CreateUserDto = {
        email: userFormData.email,
        password: userFormData.password,
        phone: userFormData.phone,
        firstName: userFormData.firstName,
        lastName: userFormData.lastName,
        dni: userFormData.dni,
        role: userFormData.role
      }
      await usersService.create(createData)
      success('User created successfully')
    }
    userDialog.value = false
    emit('updateList')
  } catch (err: any) {
    console.error('Failed to save user:', err)
    error(err.message || 'Error saving user')
  } finally {
    savingUser.value = false
  }
}

async function deleteUser(user: User) {
  if (!confirm(`Are you sure you want to delete user ${user.profile?.firstName} ${user.profile?.lastName}?`)) {
    return
  }
  try {
    await usersService.delete(user.id)
    success('User deleted')
    emit('updateList')
  } catch (err) {
    error('Failed to delete user')
  }
}

// Expose functions for parent component to call
defineExpose({
    fetchUsers,
    openUserDialog
})
</script>

<style scoped>
.admin-tab-card {
  border-radius: 8px !important;
  border: 1px solid rgba(var(--v-border-color), 0.4) !important;
}

.border-bottom-thick {
    border-bottom: 2px solid rgba(var(--v-border-color), 0.15) !important;
}

.letter-spacing-1 { letter-spacing: 1px !important; }

.gap-2 {
    gap: 8px;
}

.data-table-industrial {
    border-radius: 6px !important;
}
</style>