import { useState } from 'react'
import Cadastro from './pages/cadastro'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Cadastro />
    </>
  )
}

export default App
