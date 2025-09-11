const tasksContainer = document.getElementById('tasks-container')
const statusOptions = [
  'En attente',
  'À faire',
  'En cours',
  'À valider',
  'Terminé',
  'Échec',
]
let tasks = []

const statusColors = {
  'En attente': '#a55eea',
  'À faire': '#ffda79',
  'En cours': '#f7d794',
  'À valider': '#34ace0',
  'Terminé:': '#6eff9f',
  Échec: '#ff5252',
}

function updateStatusTag(tagElement, status) {
  tagElement.textContent = status
  tagElement.style.backgroundColor = statusColors[status] || '#888'
}

function renderTask(task) {
  const card = document.createElement('div')
  card.className = 'task-card'
  card.dataset.id = task.id

  card.innerHTML = `
      <h3>${task.name}</h3>
      <div class="status-tag"></div>
      <span class="status-label">Statut :</span>
      <select class="status-select" data-task-id="${task.id}">
         ${statusOptions
           .map(
             (option) => `
                  <option value="${option}" ${
               task.status === option ? 'selected' : ''
             }>${option}</option>
               `
           )
           .join('')}
      </select>
   `

  const select = card.querySelector('.status-select')
  const statusTag = card.querySelector('.status-tag')

  updateStatusTag(statusTag, task.status)

  select.addEventListener('change', async (e) => {
    const newStatus = e.target.value
    try {
      const response = await fetch('/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      })
      if (!response.ok) {
        console.error('Erreur lors de la mise à jour du statut sur le serveur.')
      }
    } catch (error) {
      console.error('Erreur réseau lors de la mise à jour du statut.')
    }
  })

  tasksContainer.appendChild(card)
}

async function pollForStatus(task) {
  try {
    const response = await fetch(
      `/poll-status?task_id=${task.id}&last_version=${task.version}`
    )

    if (response.ok) {
      if (response.status === 204) {
        console.log(`Tâche ${task.id}: Timeout du Long Polling. Relance.`)
      } else {
        const data = await response.json()
        console.log(
          `Tâche ${data.id}: Mise à jour reçue. Nouveau statut: ${data.status}`
        )

        const updatedTask = tasks.find((t) => t.id === data.id)
        if (updatedTask) {
          updatedTask.status = data.status
          updatedTask.version = data.version

          const selectElement = document.querySelector(
            `.status-select[data-task-id="${data.id}"]`
          )
          if (selectElement) {
            selectElement.value = data.status
          }
          const statusTagElement = document.querySelector(
            `.task-card[data-id="${data.id}"] .status-tag`
          )
          if (statusTagElement) {
            updateStatusTag(statusTagElement, data.status)
          }
        }
      }
    } else {
      console.error(
        `Erreur serveur pour la tâche ${task.id}:`,
        response.statusText
      )
    }
  } catch (error) {
    console.error(`Erreur réseau pour la tâche ${task.id}:`, error)
    await new Promise((resolve) => setTimeout(resolve, 2000))
  } finally {
    pollForStatus(task)
  }
}

async function initialize() {
  tasks = [
    {
      id: 1,
      name: 'Terminer le TP Long Polling',
      status: 'À faire',
      version: 0,
    },
    {
      id: 2,
      name: 'Rédiger le README',
      status: 'En attente',
      version: 0,
    },
  ]

  tasks.forEach((task) => {
    renderTask(task)
    pollForStatus(task)
  })
}

document.addEventListener('DOMContentLoaded', initialize)
