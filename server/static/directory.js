const url = new URL(window.location)

window.onToggle = function onToggle (details) {
  if (!details.classList.contains('started-loading')) {
    details.classList.add('started-loading')
    const params = new URLSearchParams()
    params.set('component', 'true')
    params.set('base', details.dataset.dir)
    params.set('sidebar', url.searchParams.get('sidebar'))
    fetch(details.dataset.dir + '?' + params)
      .then(r => r.text())
      .then(html => {
        details.insertAdjacentHTML('beforeend', html)
      })
  }
}

document.addEventListener('click', e => {
  if (url.searchParams.get('sidebar') && e.target.closest('a')) {
    window.parent.postMessage(e.target.href)
    e.preventDefault()
    return
  }
  const deleteBtn = e.target.closest('.delete-btn')
  if (deleteBtn) {
    deleteBtn.disabled = true
    fetch(deleteBtn.dataset.delete, {
      method: 'DELETE'
    }).then(response => {
      deleteBtn.disabled = false
      alert(response.ok ? 'deleted.' : 'failed to delete lol')
    })
  }
})
