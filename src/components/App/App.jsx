import React, { useEffect, useState } from 'react'
import { Route, Switch } from 'react-router-dom'
import PrivateRoute from '../../hoc/PrivateRoute'

import { PageView, initGA } from '../Tracking/Tracking'
import Loading from '../Loading'
import NavBar from '../NavBar'
import Footer from '../Footer'
import Profile from '../Profile'
import Landing from '../Landing/index.js'
import Documentation from '../Documentation/index'
import GridPage from '../GridPage'
import { useAuth0 } from '../../contexts'
import UserRoles from '../Profile/UserRoles'
import './App.scss'
import io from 'socket.io-client';

// fontawesome
import initFontAwesome from '../../utils/initFontAwesome'
initFontAwesome()

const App = () => {
  const { loading } = useAuth0()
  const [apiKey, setApiKey] = useState()

  useEffect(() => {

    // * SOCKET.IO-CLIENT BELOW
    const socket = io('http://localhost:5000');

    if (!!socket === true) socket.on(
      'client-operations',
      (data) => console.log('Redis API key count data.', JSON.parse(data))
    )

    /*=== function that initializes Google Analytics ===*/
    initGA(process.env.REACT_APP_GOOGLE_TRACKING_ID)
    PageView()
  })

  if (loading) {
    return <Loading />
  }

  return (
    <div className="appContainer">
      {/*className="d-flex flex-column h-100"*/}
      <NavBar />
      <Switch>
        <Route path="/" exact render={props => <Landing {...props} />} />
        <Route exact path="/data" component={GridPage} />
        <PrivateRoute
          path="/profile"
          component={Profile}
          apiKey={apiKey}
          setApiKey={setApiKey}
        />
        <Route exact path="/docs" component={Documentation} />
        <Route exact path="/plan" component={UserRoles} />
      </Switch>
      <Footer />
    </div>
  )
}

export default App
