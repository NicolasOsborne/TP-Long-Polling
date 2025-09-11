const express = require('express')
const path = require('path')

const app = express()
const PORT = 3000

const LONG_POLLING_TIMEOUT = 25000

app.use(express.static(path.join(__dirname, '..', 'client')))
app.use(express.json())

let tasks = [
  {
    id: 1,
    name: 'Terminer le TP de Long Polling',
    status: 'À faire',
    version: 0,
  },
  { id: 2, name: 'Rédiger le README', status: 'En attente', version: 0 },
]

const waitingClients = {}

const findTaskById = (id) => tasks.find((task) => task.id === parseInt(id))

app.get('/poll-status', (req, res) => {
  const { task_id, last_version } = req.query
  const task = findTaskById(task_id)

  if (!task) {
    return res.status(404).json({ error: 'Tâche non trouvée.' })
  }

  if (parseInt(last_version) < task.version) {
    console.log(
      `Le client pour la tâche ${task.id} a une version obsolète. Envoi de l'état actuel.`
    )
    return res.json({ id: task.id, status: task.status, version: task.version })
  }

  if (!waitingClients[task_id]) {
    waitingClients[task_id] = []
  }

  waitingClients[task_id].push(res)
  console.log(
    `Client en attente pour la tâche ${task.id}. Total de requêtes en attente pour cette tâche : ${waitingClients[task_id].length}`
  )

  const timeoutId = setTimeout(() => {
    const index = waitingClients[task_id].indexOf(res)
    if (index > -1) {
      waitingClients[task_id].splice(index, 1)
    }
    console.log(`Timeout atteint pour un client. Connexion fermée.`)
    res.status(204).end()
  }, LONG_POLLING_TIMEOUT)

  req.on('close', () => {
    clearTimeout(timeoutId)
    if (waitingClients[task_id]) {
      const index = waitingClients[task_id].indexOf(res)
      if (index > -1) {
        waitingClients[task_id].splice(index, 1)
        console.log(
          `Un client a fermé sa connexion. Suppression de la liste d'attente.`
        )
      }
    }
  })
})

app.post('/update-status', (req, res) => {
  const { id, status } = req.body
  const task = findTaskById(id)

  if (!task) {
    return res.status(404).json({ error: 'Tâche non trouvée.' })
  }
  if (!status) {
    return res.status(400).json({ error: 'Le champ "status" est manquant.' })
  }

  task.status = status
  task.version++

  console.log(
    `Statut de la tâche ${task.id} mis à jour à : "${task.status}". Nouvelle version : ${task.version}`
  )

  if (waitingClients[id]) {
    const clientsToNotify = [...waitingClients[id]]
    waitingClients[id].length = 0

    clientsToNotify.forEach((clientRes) => {
      clientRes.json({
        id: task.id,
        status: task.status,
        version: task.version,
      })
    })
  }

  res.json({ message: 'Statut mis à jour et clients notifiés.' })
})

app.listen(PORT, () => {
  console.log(`Serveur Node.js démarré sur http://localhost:${PORT}`)
})
