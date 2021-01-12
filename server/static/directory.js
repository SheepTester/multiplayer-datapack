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
