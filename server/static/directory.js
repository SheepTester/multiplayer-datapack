window.onToggle = function onToggle (details) {
  if (!details.classList.contains('started-loading')) {
    details.classList.add('started-loading')
    fetch(details.dataset.dir + '?component=true&base=' + encodeURIComponent(details.dataset.dir))
      .then(r => r.text())
      .then(html => {
        details.insertAdjacentHTML('beforeend', html)
      })
  }
}

const url = new URL(window.location)
if (url.searchParams.get('sidebar')) {
  document.addEventListener('click', e => {
    if (e.target.closest('a')) {
      window.parent.postMessage(e.target.href)
      e.preventDefault()
    }
  })
}
