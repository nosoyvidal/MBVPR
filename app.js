// Elementos del DOM
let taskModal;
const projectForm = document.getElementById('projectForm');
const projectList = document.getElementById('projectList');
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const projectsView = document.getElementById('projectsView');
const kanbanView = document.getElementById('kanbanView');
const taskTagInput = document.getElementById('taskTagInput');
const tagColor = document.getElementById('tagColor');
const addTagBtn = document.getElementById('addTagBtn');
const selectedTags = document.getElementById('selectedTags');
const emojiPickerBtn = document.getElementById('emojiPickerBtn');

// Funciones para manejar localStorage
const PROJECTS_STORAGE_KEY = 'projectmanager_projects';
const TASKS_STORAGE_KEY = 'projectmanager_tasks';

// Variables para manejar las etiquetas
let currentTags = [];
let selectedEmoji = '🏷️'; // Emoji por defecto

// Etiquetas de estado predefinidas
const STATUS_TAGS = {
    pendiente: { name: 'Pendiente', color: '#ffc107', emoji: '⏳' },
    en_progreso: { name: 'En Progreso', color: '#0dcaf0', emoji: '🔄' },
    completado: { name: 'Completado', color: '#198754', emoji: '✅' }
};

// Emojis predefinidos para el selector
const EMOJI_CATEGORIES = {
    'Frecuentes': ['🏷️', '📌', '⭐', '💡', '🎯', '📝', '📋', '📅', '⏰', '🔔'],
    'Prioridad': ['🔴', '🟡', '🟢', '⚪', '⚫'],
    'Estado': ['📊', '📈', '📉', '✅', '❌', '⚠️', '⏳', '🔄'],
    'Tipo': ['💻', '📱', '🔧', '🎨', '📚', '💬', '📧', '🔍'],
    'Personas': ['👤', '👥', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍🔧', '👩‍🔧'],
    'Animales': ['🐶', '🐱', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨'],
    'Plantas': ['🌸', '🌷', '🌹', '🌺', '🌻', '🌼', '🌽', '🌾'],
    'Objetos': ['🎁', '🎈', '🎉', '🎊', '🎄', '🎋', '🎍', '🎎'],
    'Colores': ['🔴', '🟡', '🟢', '⚪', '⚫'],
    'Estados': ['📊', '📈', '📉', '✅', '❌', '⚠️', '⏳', '🔄']
};

function getProjects() {
    try {
        const projects = localStorage.getItem(PROJECTS_STORAGE_KEY);
        return projects ? JSON.parse(projects) : [];
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        return [];
    }
}

function saveProjects(projects) {
    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
        console.error('Error al guardar proyectos:', error);
        alert('Error al guardar los proyectos');
    }
}

function getTasks() {
    try {
        const tasks = localStorage.getItem(TASKS_STORAGE_KEY);
        return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        return [];
    }
}

function saveTasks(tasks) {
    try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error('Error al guardar tareas:', error);
        alert('Error al guardar las tareas');
    }
}

function createProject(projectData) {
    const projects = getProjects();
    const newProject = {
        ...projectData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        members: projectData.members ? projectData.members.split(',').map(member => member.trim()).filter(member => member) : []
    };
    projects.push(newProject);
    saveProjects(projects);
    return newProject;
}

function deleteProject(projectId) {
    const project = getProjects().find(p => p.id === projectId);
    if (!project) return;

    const projectName = project.name;
    const confirmationInput = prompt(`Para eliminar el proyecto "${projectName}", escribe su nombre exactamente:`);
    
    if (confirmationInput === projectName) {
        const projects = getProjects();
        const filteredProjects = projects.filter(p => p.id !== projectId);
        saveProjects(filteredProjects);

        // También eliminar las tareas asociadas al proyecto
        const tasks = getTasks();
        const filteredTasks = tasks.filter(t => t.projectId !== projectId);
        saveTasks(filteredTasks);

        // Actualizar la vista
        renderProjects(filteredProjects);
        renderKanban();
    } else {
        alert('El nombre del proyecto no coincide. La eliminación ha sido cancelada.');
    }
}

// Función para obtener los miembros disponibles del proyecto
function getProjectMembers(projectId) {
    const project = getProjects().find(p => p.id === projectId);
    return project ? (project.members || []) : [];
}

// Función para validar miembros de tarea
function validateTaskMembers(projectId, members) {
    const projectMembers = getProjectMembers(projectId);
    const invalidMembers = members.filter(member => !projectMembers.includes(member));

    if (invalidMembers.length > 0) {
        throw new Error(`Los siguientes miembros no están en el proyecto: ${invalidMembers.join(', ')}`);
    }

    return members;
}

// Función para crear el selector de emojis
function createEmojiPicker() {
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    picker.innerHTML = `
        <div class="emoji-picker-header">
            <h6>Seleccionar Emoji</h6>
            <button class="btn-close" onclick="closeEmojiPicker()"></button>
        </div>
        <div class="emoji-picker-body">
            ${Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => `
                <div class="emoji-category">
                    <h6>${category}</h6>
                    <div class="emoji-grid">
                        ${emojis.map(emoji => `
                            <button class="emoji-btn ${emoji === selectedEmoji ? 'selected' : ''}" 
                                    onclick="selectEmoji('${emoji}')">
                                ${emoji}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    return picker;
}

// Función para mostrar el selector de emojis
function showEmojiPicker() {
    const picker = createEmojiPicker();
    document.body.appendChild(picker);
    
    // Posicionar el selector cerca del botón
    const btnRect = emojiPickerBtn.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    
    // Calcular la posición
    let top = btnRect.bottom + window.scrollY;
    let left = btnRect.left;
    
    // Ajustar si el selector se sale de la ventana
    if (left + pickerRect.width > window.innerWidth) {
        left = window.innerWidth - pickerRect.width;
    }
    
    if (top + pickerRect.height > window.innerHeight) {
        top = btnRect.top - pickerRect.height + window.scrollY;
    }
    
    picker.style.top = `${top}px`;
    picker.style.left = `${left}px`;
}

// Función para cerrar el selector de emojis
function closeEmojiPicker() {
    const picker = document.querySelector('.emoji-picker');
    if (picker) {
        picker.remove();
    }
}

// Función para seleccionar un emoji
function selectEmoji(emoji) {
    selectedEmoji = emoji;
    closeEmojiPicker();
}

// Event listener para el botón de emoji
emojiPickerBtn.addEventListener('click', showEmojiPicker);

// Cerrar el selector al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!e.target.closest('.emoji-picker') && !e.target.closest('#emojiPickerBtn')) {
        closeEmojiPicker();
    }
});

// Modificar la función addTag
function addTag() {
    const tagName = taskTagInput.value.trim();
    if (tagName) {
        const tag = {
            name: tagName,
            color: tagColor.value,
            emoji: selectedEmoji
        };
        currentTags.push(tag);
        renderTags();
        taskTagInput.value = '';
        selectedEmoji = '🏷️'; // Resetear el emoji seleccionado
    }
}

// Función para renderizar las etiquetas
function renderTags() {
    selectedTags.innerHTML = currentTags.map((tag, index) => `
        <span class="tag-badge" style="background-color: ${tag.color}" data-index="${index}">
            <span class="tag-emoji" onclick="changeTagEmoji(${index})">${tag.emoji}</span>
            <span class="tag-name">${tag.name}</span>
            <i class="fas fa-times remove-tag" onclick="removeTag(${index})"></i>
        </span>
    `).join('');
}

// Event listener para el botón de agregar etiqueta
addTagBtn.addEventListener('click', addTag);

// Event listener para la tecla Enter en el input de etiquetas
taskTagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
    }
});

// Modificar la función createTask
function createTask(projectId, taskData) {
    const tasks = getTasks();
    const members = taskData.members.split(',').map(member => member.trim()).filter(member => member);

    // Validar miembros antes de crear la tarea
    validateTaskMembers(projectId, members);

    const newTask = {
        ...taskData,
        id: Date.now().toString(),
        projectId: projectId,
        createdAt: new Date().toISOString(),
        completed: false,
        status: 'pendiente',
        members: members,
        tags: [...currentTags] // Crear una copia del array de etiquetas
    };
    tasks.push(newTask);
    saveTasks(tasks);
    return newTask;
}

function getTasksByProject(projectId) {
    const tasks = getTasks();
    return tasks.filter(task => task.projectId === projectId);
}

function updateTask(taskId, taskData) {
    const tasks = getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...taskData };
        saveTasks(tasks);
        return tasks[index];
    }
    return null;
}

function deleteTask(taskId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        const tasks = getTasks();
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        saveTasks(filteredTasks);

        // Actualizar ambas vistas
        const projectId = tasks.find(t => t.id === taskId)?.projectId;
        if (projectId) {
            renderTasks(projectId);
        }
        renderKanban();
    }
}

function toggleTaskStatus(taskId) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.status = task.completed ? 'completado' : 'pendiente';
        saveTasks(tasks);
    }
}

function updateTaskStatus(taskId, newStatus) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        task.completed = newStatus === 'completado';
        
        // Actualizar etiquetas de estado
        const statusTag = {
            ...STATUS_TAGS[newStatus],
            isStatusTag: true
        };
        
        // Eliminar etiquetas de estado anteriores
        task.tags = task.tags.filter(tag => !tag.isStatusTag);
        task.tags.push(statusTag);
        
        saveTasks(tasks);
    }
}

// Función para renderizar la lista de proyectos
function renderProjects() {
    try {
        const projects = getProjects();
        projectList.innerHTML = projects.map(project => `
            <div class="project-card">
                <div class="project-header">
                    <h3>${project.name}</h3>
                    <div class="project-actions">
                        <button class="btn btn-sm btn-success" onclick="openTaskModal('${project.id}', 'create')">
                            <i class="fas fa-plus"></i> Nueva Tarea
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="openTaskModal('${project.id}', 'view')">
                            <i class="fas fa-list"></i> Ver Tareas
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editProject('${project.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProject('${project.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p>${project.description || ''}</p>
                <div class="project-members">
                    <h4>Miembros:</h4>
                    <div class="member-list">
                        ${(project.members || []).map(member => `
                            <span class="member-badge">
                                <i class="fas fa-user"></i> ${member}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al renderizar proyectos:', error);
        projectList.innerHTML = '<div class="alert alert-danger">Error al cargar los proyectos</div>';
    }
}

// Función para renderizar las tareas
function renderTasks(projectId) {
    try {
        const tasks = getTasksByProject(projectId);
        taskList.innerHTML = tasks.map(task => `
            <div class="list-group-item ${task.completed ? 'completed' : ''}">
                <div class="task-header">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" 
                               ${task.completed ? 'checked' : ''} 
                               onchange="toggleTaskStatus('${task.id}')">
                        <label class="form-check-label task-title">
                            ${task.title}
                        </label>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-warning" onclick="editTask('${task.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-content">
                    <div class="task-description">${task.description || ''}</div>
                    <div class="task-tags">
                        ${(task.tags || []).map(tag => `
                            <span class="tag-badge ${tag.isStatusTag ? 'status-tag' : ''}" style="background-color: ${tag.color}">
                                <span class="tag-emoji">${tag.emoji}</span>
                                <span class="tag-name">${tag.name}</span>
                            </span>
                        `).join('')}
                    </div>
                    <div class="task-members">
                        ${(task.members || []).map(member => `
                            <span class="members-badge">
                                <i class="fas fa-user"></i> ${member}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al renderizar tareas:', error);
        taskList.innerHTML = '<div class="alert alert-danger">Error al cargar las tareas</div>';
    }
}

// Función para renderizar la vista Kanban
function renderKanban() {
    const tasks = getTasks();
    const pendingTasks = tasks.filter(task => task.status === 'pendiente');
    const inProgressTasks = tasks.filter(task => task.status === 'en_progreso');
    const completedTasks = tasks.filter(task => task.status === 'completado');

    document.getElementById('pendingTasks').innerHTML = renderKanbanTasks(pendingTasks);
    document.getElementById('inProgressTasks').innerHTML = renderKanbanTasks(inProgressTasks);
    document.getElementById('completedTasks').innerHTML = renderKanbanTasks(completedTasks);

    // Hacer las tareas arrastrables
    makeTasksDraggable();
}

function renderKanbanTasks(tasks) {
    return tasks.map(task => `
        <div class="kanban-task" draggable="true" data-task-id="${task.id}">
            <div class="kanban-task-header">
                <h6>${task.title}</h6>
                <button class="btn-close btn-close-white" onclick="deleteTask('${task.id}')"></button>
            </div>
            <p>${task.description || ''}</p>
            <div class="task-tags">
                ${(task.tags || []).map(tag => `
                    <span class="tag-badge ${tag.isStatusTag ? 'status-tag' : ''}" style="background-color: ${tag.color}">
                        <span class="tag-emoji">${tag.emoji}</span>
                        <span class="tag-name">${tag.name}</span>
                    </span>
                `).join('')}
            </div>
            <div class="members-container">
                ${(task.members || []).map(member => `
                    <span class="members-badge">
                        <i class="fas fa-user"></i> ${member}
                    </span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function makeTasksDraggable() {
    const tasks = document.querySelectorAll('.kanban-task');
    const lists = document.querySelectorAll('.kanban-list');

    tasks.forEach(task => {
        task.addEventListener('dragstart', () => {
            task.classList.add('dragging');
            // Agregar clase a la lista de origen
            const sourceList = task.closest('.kanban-list');
            if (sourceList) {
                sourceList.classList.add('drag-over');
            }
        });

        task.addEventListener('dragend', () => {
            task.classList.remove('dragging');
            // Remover clase de todas las listas
            lists.forEach(list => list.classList.remove('drag-over'));
        });
    });

    lists.forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            if (dragging) {
                const afterElement = getDragAfterElement(list, e.clientY);
                if (afterElement) {
                    list.insertBefore(dragging, afterElement);
                } else {
                    list.appendChild(dragging);
                }
                list.classList.add('drag-over');
            }
        });

        list.addEventListener('dragleave', () => {
            list.classList.remove('drag-over');
        });

        list.addEventListener('drop', e => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            if (dragging) {
                const taskId = dragging.dataset.taskId;
                const newStatus = getStatusFromList(list);
                updateTaskStatus(taskId, newStatus);
                renderKanban();
            }
            list.classList.remove('drag-over');
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-task:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function getStatusFromList(list) {
    if (list.id === 'pendingTasks') return 'pendiente';
    if (list.id === 'inProgressTasks') return 'en_progreso';
    if (list.id === 'completedTasks') return 'completado';
    return 'pendiente';
}

// Funciones para cambiar entre vistas
function showProjectsView() {
    projectsView.style.display = 'block';
    kanbanView.style.display = 'none';
    renderProjects(getProjects());
}

function showKanbanView() {
    projectsView.style.display = 'none';
    kanbanView.style.display = 'block';
    renderKanban();
}

// Función para mostrar los miembros disponibles
function showAvailableMembers(projectId) {
    const members = getProjectMembers(projectId);
    const availableMembersContainer = document.getElementById('availableMembers');

    if (members.length === 0) {
        availableMembersContainer.innerHTML = `
            <div class="members-helper warning">
                <i class="fas fa-exclamation-triangle"></i>
                No hay miembros en el proyecto. Agrega miembros al proyecto primero.
            </div>
        `;
        return;
    }

    availableMembersContainer.innerHTML = members.map(member => `
        <span class="available-member" onclick="addMemberToTask('${member}')">
            <i class="fas fa-user"></i> ${member}
        </span>
    `).join('');
}

// Función para agregar un miembro al campo de tarea
function addMemberToTask(member) {
    const membersInput = document.getElementById('taskMembers');
    const currentMembers = membersInput.value.split(',').map(m => m.trim()).filter(m => m);

    if (!currentMembers.includes(member)) {
        if (currentMembers.length > 0) {
            membersInput.value += `, ${member}`;
        } else {
            membersInput.value = member;
        }
    }
}

// Modificar la función openTaskModal
function openTaskModal(projectId, mode = 'view') {
    const project = getProjects().find(p => p.id === projectId);
    if (project) {
        document.getElementById('currentProjectId').value = projectId;
        document.getElementById('currentProjectName').textContent = project.name;
        
        // Configurar el modal según el modo
        const taskForm = document.getElementById('taskForm');
        const taskList = document.getElementById('taskList');
        const submitButton = taskForm.querySelector('button[type="submit"]');
        
        if (mode === 'create') {
            // Modo creación
            taskForm.style.display = 'block';
            taskList.style.display = 'none';
            submitButton.innerHTML = '<i class="fas fa-plus"></i> Crear Tarea';
            taskForm.reset();
            delete taskForm.dataset.editId;
            
            // Resetear las etiquetas
            currentTags = [];
            renderTags();
            
            // Mostrar miembros disponibles
            showAvailableMembers(projectId);
        } else {
            // Modo visualización
            taskForm.style.display = 'none';
            taskList.style.display = 'block';
            renderTasks(projectId);
        }

        if (taskModal) {
            taskModal.show();
        }
    }
}

// Función para cerrar el modal de tareas
function closeTaskModal() {
    if (taskModal) {
        taskModal.hide();
    }
}

// Event listener para el formulario de proyectos
projectForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        status: document.getElementById('projectStatus').value,
        members: document.getElementById('projectMembers').value
    };

    try {
        const editId = projectForm.dataset.editId;
        if (editId) {
            // Actualizar proyecto existente
            const projects = getProjects();
            const index = projects.findIndex(p => p.id === editId);
            if (index !== -1) {
                projects[index] = {
                    ...projects[index],
                    ...projectData,
                    members: projectData.members.split(',').map(member => member.trim()).filter(member => member)
                };
                saveProjects(projects);
            }
        } else {
            // Crear nuevo proyecto
            createProject(projectData);
        }

        // Resetear el formulario
        projectForm.reset();
        delete projectForm.dataset.editId;
        const submitButton = projectForm.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Proyecto';

        renderProjects();
    } catch (error) {
        alert('Error al guardar el proyecto');
    }
});

// Event listener para el formulario de tareas
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const projectId = document.getElementById('currentProjectId').value;
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        members: document.getElementById('taskMembers').value
    };

    try {
        const members = taskData.members.split(',').map(member => member.trim()).filter(member => member);

        // Validar miembros antes de proceder
        validateTaskMembers(projectId, members);

        const editId = taskForm.dataset.editId;
        if (editId) {
            // Actualizar tarea existente
            const tasks = getTasks();
            const index = tasks.findIndex(t => t.id === editId);
            if (index !== -1) {
                tasks[index] = {
                    ...tasks[index],
                    ...taskData,
                    members: members,
                    tags: [...currentTags] // Crear una copia de las etiquetas actuales
                };
                saveTasks(tasks);
            }
        } else {
            // Crear nueva tarea
            createTask(projectId, taskData);
        }

        // Resetear el formulario
        taskForm.reset();
        delete taskForm.dataset.editId;
        const submitButton = taskForm.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-plus"></i> Agregar Tarea';

        // Resetear las etiquetas
        currentTags = [];
        renderTags();

        renderTasks(projectId);
        renderKanban();

        // Cerrar el modal después de guardar
        if (taskModal) {
            taskModal.hide();
        }
    } catch (error) {
        alert(error.message);
    }
});

function editProject(projectId) {
    const project = getProjects().find(p => p.id === projectId);
    if (project) {
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectStatus').value = project.status;
        document.getElementById('projectMembers').value = project.members.join(', ');

        // Cambiar el botón de submit
        const submitButton = projectForm.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Proyecto';

        // Agregar el ID del proyecto al formulario
        projectForm.dataset.editId = projectId;
    }
}

// Modificar la función editTask
function editTask(taskId) {
    const task = getTasks().find(t => t.id === taskId);
    if (task) {
        const projectMembers = getProjectMembers(task.projectId);
        
        // Mostrar el formulario y ocultar la lista
        const taskForm = document.getElementById('taskForm');
        const taskList = document.getElementById('taskList');
        taskForm.style.display = 'block';
        taskList.style.display = 'none';
        
        // Restaurar los datos de la tarea
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskMembers').value = task.members.join(', ');
        
        // Restaurar las etiquetas
        currentTags = task.tags ? [...task.tags] : [];
        renderTags();
        
        // Mostrar miembros disponibles
        showAvailableMembers(task.projectId);
        
        // Cambiar el botón de submit
        const submitButton = taskForm.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Tarea';
        
        // Agregar el ID de la tarea al formulario
        taskForm.dataset.editId = taskId;
        
        // Asegurarse de que el modal esté abierto
        if (taskModal) {
            taskModal.show();
        }
    }
}

// Cargar proyectos al iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Inicializar el modal de Bootstrap
        const modalElement = document.getElementById('taskModal');
        if (modalElement) {
            taskModal = new bootstrap.Modal(modalElement);
        }

        // Limpiar localStorage si es necesario
        if (!localStorage.getItem(PROJECTS_STORAGE_KEY)) {
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(TASKS_STORAGE_KEY)) {
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify([]));
        }

        // Mostrar la vista inicial
        showProjectsView();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        // Intentar limpiar el localStorage y recargar
        try {
            localStorage.clear();
            location.reload();
        } catch (e) {
            alert('Error al cargar los proyectos. Por favor, recarga la página manualmente.');
        }
    }
}); 