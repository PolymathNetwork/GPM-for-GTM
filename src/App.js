import React, { useContext, useEffect, Fragment } from 'react'
import { Store } from './index'
import { Polymath, browserUtils } from '@polymathnetwork/sdk'
import { Layout, Spin, Icon, Typography, Alert } from 'antd'

const { Content, Header } = Layout
const { Text } = Typography

const networkConfigs = {
  1: {
    polymathRegistryAddress: '0xdfabf3e4793cd30affb47ab6fa4cf4eef26bbc27'
  },
  42: {
    polymathRegistryAddress: '0x5b215a7d39ee305ad28da29bf2f0425c6c2a00b3'
  },
  15: {
    polymathRegistryAddress: '0x9FBDa871d559710256a2502A2517b794B482Db40'
  }
}

export const reducer = (state, action) => {
  switch (action.type) {
  case 'INITALIZING':
    return {
      ...state,
      loading: true,
      loadingMessage: 'Initializing Polymath SDK',
      error: undefined,
    }
  case 'INITIALIZED':
    const { sdk, networkId, walletAddress } = action
    return {
      ...state,
      loading: false,
      loadingMessage: '',
      error: undefined,
      sdk,
      networkId,
      walletAddress
    }
  case 'ERROR':
    const { error } = action
    return {
      ...state,
      loading: false,
      loadingMessage: '',
      error,
    }
  default:
    throw new Error(`Unrecognized action type: ${action.type}`)
  }
}

function Network({networkId}) {
  const networks = {
    0: 'Disconnected',
    1: 'Mainnet',
    42: 'Kovan'
  }
  return (
    <Fragment>
      <Icon type="global" style={{
        marginRight: 10,
        marginLeft: 20
      }} />
      <Text>{networks[networkId]}</Text>
    </Fragment>
  )
}

function User({walletAddress}) {
  if (walletAddress)
    return (
      <Fragment>
        <Icon type="user" style={{
          marginRight: 5,
          marginLeft: 10
        }}/>
        <Text>{walletAddress}</Text>
      </Fragment>
    )
  return null
}

function App() {
  const [state, dispatch] = useContext(Store)
  const { sdk, loading, loadingMessage, walletAddress, error, networkId } = state.AppReducer

  // Initialize the SDK.
  useEffect(() => {
    async function init() {
      dispatch({type: 'INITALIZING'})

      try {
        const networkId = await browserUtils.getNetworkId()
        const walletAddress = await browserUtils.getCurrentAddress()
        if (![-1, 1, 42].includes(networkId)) {
          dispatch({
            type: 'ERROR',
            error: 'Please switch to either Main or Kovan network'
          })
          return
        }

        const config = networkConfigs[networkId]
        const sdk = new Polymath()
        await sdk.connect(config)
        dispatch({
          type: 'INITIALIZED',
          networkId,
          sdk,
          walletAddress,
        })
      }
      catch(error) {
        dispatch({
          type: 'ERROR',
          error: error.message
        })
      }
    }
    if (!sdk) {
      init()
    }
  }, [dispatch, sdk])

  return (
    <div>
      <Spin spinning={loading} tip={loadingMessage} size="large">
        <Layout>
          <Header style={{
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}>
            <Network networkId={networkId} />
            <User walletAddress={walletAddress} />
          </Header>
          <Content style={{
            padding: 50,
            backgroundColor: '#FAFDFF'
          }}>
            {error && <Alert
              message={error}
              type="error"
              closable
              showIcon
            />}
          </Content>
        </Layout>
      </Spin>
    </div>
  )
}

export default App
