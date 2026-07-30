import Home from './pages/Home'
import Lista from './pages/Lista'

function App() {
  const path = window.location.pathname
  if (path === '/lista') {
    return <Lista />
  }
  return <Home />
}

export default App
