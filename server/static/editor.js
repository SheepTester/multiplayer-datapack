const deleteBtn = document.getElementById('delete')
deleteBtn.addEventListener('click', e => {
  deleteBtn.disabled = true
  fetch(window.location.href, {
    method: 'DELETE'
  }).then(response => {
    deleteBtn.disabled = false
    alert(response.ok ? 'deleted.' : 'failed to delete lol')
  })
})
