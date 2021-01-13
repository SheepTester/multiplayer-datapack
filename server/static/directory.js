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

if (url.searchParams.get('sidebar')) {
  document.addEventListener('click', e => {
    if (e.target.closest('a')) {
      window.parent.postMessage(e.target.href)
      e.preventDefault()
    }
  })
}
