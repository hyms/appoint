<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick">
        <span class="text-overline font-weight-black letter-spacing-1">{{ $t('admin.userManagement') }}</span>
    </v-card-title>
    <v-card-text>
        <v-alert type="warning" variant="tonal" rounded="md" class="mb-6">
            {{ $t('admin.userManagementInstruction') }}
        </v-alert>

        <v-row class="mb-4">
            <v-col cols="12" sm="6" md="3">
                <BaseSelect
                    v-model="filters.role"
                    :label="$t('admin.filterByRole')"
                    :items="roleOptions"
                    item-title="text"
                    item-value="value"
                    hide-details
                    @update:model-value="loadUsers"
                />
            </v-col>
            <v-col cols="12" sm="6" md="3">
                <BaseSelect
                    v-model="filters.isActive"
                    :label="$t('admin.status')"
                    :items="activeOptions"
                    item-title="text"
                    item-value="value"
                    hide-details
                    @update:model-value="loadUsers"
                />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center justify-end gap-2 pt-3 pt-md-0">
                <BaseButton color="primary" variant="text" prepend-icon="mdi-plus" @click="openUserDialog()">
                    {{ $t('admin.newUser') }}
                </BaseButton>
                <BaseButton color="primary" variant="text" prepend-icon="mdi-refresh" @click="loadUsers" />
            </v-col>
        </v-row>
        
        <v-data-table
            :headers="headers"
            :items="users"
            :loading="loading"
            :items-per-page="10"
            :items-per-page-text="$t('common.itemsPerPage')"
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
                  {{ item.isActive ? $t('admin.active') : $t('admin.inactive') }}
                </v-chip>
            </template>
            <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
            </template>
            <template v-slot:item.actions="{ item }">
                <v-btn size="small" color="primary" variant="text" @click="openUserDialog(item)">
                  {{ $t('common.edit') }}
                </v-btn>
                <v-btn size="small" color="error" variant="text" icon="mdi-delete" @click="handleDeleteUser(item)" />
            </template>
        </v-data-table>
    </v-card-text>

    <v-dialog v-model="userDialog" max-width="600" @after-leave="resetForm">
      <v-card>
        <v-card-title>{{ editingUser ? $t('admin.editUser') : $t('admin.createNewUser') }}</v-card-title>
        <v-card-text>
          <v-form ref="userFormRef" @submit.prevent="saveUser" class="d-flex flex-column gap-4">
            <BaseInput v-model="userFormData.email" :label="$t('admin.email')" required :rules="emailRules" variant="outlined" rounded="md" />
            <BaseInput v-if="!editingUser" v-model="userFormData.password" :label="$t('admin.password')" type="password" required :rules="passwordRules" variant="outlined" rounded="md" />
            <BaseInput v-model="userFormData.phone" :label="$t('admin.phone')" type="tel" variant="outlined" rounded="md" />
            <div class="d-flex gap-4">
              <BaseInput v-model="userFormData.firstName" :label="$t('admin.name')" required :rules="[(v: string) => !!v || $t('admin.nameRequired')]" variant="outlined" rounded="md" class="flex-grow-1" />
              <BaseInput v-model="userFormData.lastName" :label="$t('admin.lastName')" required :rules="[(v: string) => !!v || $t('admin.lastNameRequired')]" variant="outlined" rounded="md" class="flex-grow-1" />
            </div>
            <BaseInput v-model="userFormData.dni" label="DNI" variant="outlined" rounded="md" />
            <BaseSelect v-model="userFormData.role" :label="$t('admin.role')" :items="roleOptions" item-title="text" item-value="value" required :rules="[(v: string) => !!v || $t('admin.roleRequired')]" />
            <v-switch v-if="editingUser" v-model="userFormData.isActive" :label="$t('admin.userActive')" color="success" inset />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <BaseButton variant="text" @click="userDialog = false">{{ $t('common.cancel') }}</BaseButton>
          <BaseButton color="primary" @click="saveUser" :loading="savingUser">
            {{ editingUser ? $t('admin.update') : $t('admin.create') }}
          </BaseButton>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
import { useAppColors } from '@/composables/useAppColors'
import { useAuthStore } from '@/stores/auth'
import { usersService, type User, type UpdateUserDto, type CreateUserDto } from '@/services/users'
import { formatDate } from '@/utils/date'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'

const { success, error } = useToast()
const { getRoleColor } = useAppColors()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.user?.role === 'ADMIN')

const props = defineProps<{
    modelValue: { role: string, isActive: boolean | undefined }
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void
    (e: 'updateList'): void
    (e: 'openUserDialog', user?: User): void
    (e: 'deleteUser', user: User): void
}>()

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

async function loadUsers() {
    loading.value = true
    try {
        const data = await usersService.getAll(filters.value.role || undefined)
        users.value = data
    } catch (err) {
        console.error('Failed to load users:', err)
        error(t('admin.failedToLoadPatients')) // Usamos una clave genérica existente o podrias agregar una específica
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadUsers()
})

watch(() => props.modelValue, () => {
    loadUsers()
}, { deep: true })

function openUserDialog(user?: User) {
    if (user) {
        editingUser.value = user
        userFormData.email = user.email
        userFormData.phone = user.phone || ''
        userFormData.firstName = user.profile?.firstName || ''
        userFormData.lastName = user.profile?.lastName || ''
        userFormData.dni = user.profile?.dni || ''
        userFormData.role = user.role
        userFormData.isActive = user.isActive
    } else {
        editingUser.value = null
        resetForm()
    }
    userDialog.value = true
}

const allRoleOptions = [
  { text: 'Administrator', value: 'ADMIN' },
  { text: 'Secretary', value: 'SECRETARY' },
  { text: 'Professional', value: 'PROFESSIONAL' },
  { text: 'Patient', value: 'PATIENT' }
]

const roleOptions = computed(() => {
  if (isAdmin.value) {
    return allRoleOptions
  }
  return allRoleOptions.filter(r => r.value !== 'ADMIN')
})
const activeOptions = computed(() => [
  { text: t('admin.active'), value: true },
  { text: t('admin.inactive'), value: false }
])

const headers = computed(() => [
  { title: t('admin.name'), key: 'profile.firstName' },
  { title: t('admin.email'), key: 'email' },
  { title: t('admin.phone'), key: 'phone' },
  { title: t('admin.role'), key: 'role' },
  { title: t('admin.status'), key: 'isActive' },
  { title: t('admin.created'), key: 'createdAt' },
  { title: t('admin.actions'), key: 'actions', sortable: false }
])

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
  (v: string) => !!v || t('admin.emailRequired'),
  (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t('admin.emailValid'),
]
const passwordRules = [
  (v: string) => !!v || t('admin.passwordRequired'),
  (v: string) => v.length >= 6 || t('admin.passwordMinLength'),
]

function resetForm() {
  userFormData.email = ''
  userFormData.password = ''
  userFormData.phone = ''
  userFormData.firstName = ''
  userFormData.lastName = ''
  userFormData.dni = ''
  userFormData.role = 'PATIENT'
  userFormData.isActive = true
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
                isActive: userFormData.isActive,
            }
            if (userFormData.password) {
                updateData.password = userFormData.password
            }
            await usersService.update(editingUser.value.id, updateData)
            success(t('admin.update'))
        } else {
            if (!userFormData.password) {
                error(t('admin.passwordRequired'))
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
            success(t('admin.create'))
        }
        userDialog.value = false
        loadUsers()
    } catch (err: any) {
        console.error('Failed to save user:', err)
        error(err.message || t('common.error'))
    } finally {
        savingUser.value = false
    }
}

async function handleDeleteUser(user: User) {
    if (confirm(t('admin.confirmDeleteUser', { email: user.email }))) {
        try {
            await usersService.delete(user.id)
            success(t('admin.userDeletedSuccess'))
            loadUsers()
        } catch (err: any) {
            console.error('Failed to delete user:', err)
            error(err.message || t('admin.failedToDeleteUser'))
        }
    }
}
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