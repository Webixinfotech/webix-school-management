import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { NotificationProvider } from './context/NotificationContext'
import GlobalToast from './components/shared/GlobalToast'

function App() {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
      <GlobalToast />
    </NotificationProvider>
  )
}

export default App
