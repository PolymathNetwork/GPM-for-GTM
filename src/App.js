import React, { useContext, useEffect, Fragment } from 'react'
import { Store } from './index'
import { Polymath, browserUtils } from '@polymathnetwork/sdk'
import { Layout, Spin, Icon, Typography, Alert, Button, Descriptions, Badge, Divider } from 'antd'
import TokenSelector from './TokenSelector'
import PMDisplay from './PMDisplay'
import { _split } from './index'
const { Content, Header, Sider } = Layout
const { Text } = Typography

const PERMISSIONS_FEATURE = 'Permissions'

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
  console.log('ACTION', action)
  switch (action.type) {
  case 'ASYNC_START':
    return {
      ...state,
      loading: true,
      loadingMessage: action.msg,
      error: undefined,
    }
  case 'ASYNC_COMPLETE':
    const { type, ...payload } = action
    return {
      ...state,
      ...payload,
      loading: false,
      loadingMessage: '',
      error: undefined
    }
  case 'ERROR':
  case 'ASYNC_ERROR':
    const { error } = action
    return {
      ...state,
      loading: false,
      loadingMessage: '',
      error,
    }
  case 'TOKEN_SELECTED':
    const { tokenIndex } = action
    return {
      ...state,
      tokenIndex,
      delegates: undefined,
      pmEnabled: undefined,
      error: undefined,
      features: undefined,
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

function Features({features, pmEnabled, onClick}) {
  return (
    <Descriptions column={4} style={{marginBottom: 50}}>
      <Descriptions.Item key='Permissions' label='Permissions'>
        { pmEnabled
          ? <Badge status='success' text='enabled' />
          : <Button type="primary" onClick={onClick}>Enable</Button> }
      </Descriptions.Item>
      }
      {Object.keys(features).map(feat => {
        return (<Descriptions.Item key={feat} label={_split(feat)}>
          <Badge status={features[feat] ? 'success' : 'error'} text={features[feat] ? 'enabled' : 'disabled'} />
        </Descriptions.Item>
        )}
      )}
    </Descriptions> )
}

function App() {
  const [state, dispatch] = useContext(Store)
  const {
    sdk,
    loading,
    loadingMessage,
    walletAddress,
    error,
    networkId,
    tokens,
    tokenIndex,
    pmEnabled,
    records,
    features,
    availableRoles
  } = state.AppReducer
  const token = tokens[tokenIndex]

  // Initialize the SDK.
  useEffect(() => {
    async function init() {
      dispatch({type: 'ASYNC_START', msg: 'Initializing Polymath SDK'})

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
          type: 'ASYNC_COMPLETE',
          networkId,
          sdk,
          walletAddress,
        })
      }
      catch(error) {
        dispatch({
          type: 'ASYNC_ERROR',
          error: error.message
        })
      }
    }
    if (!sdk) {
      init()
    }
  }, [dispatch, sdk])

  // Fetch tokens
  useEffect(() => {
    async function getTokens(dispatch, sdk, walletAddress) {
      dispatch({type: 'ASYNC_START', msg: 'Loading tokens'})
      const tokens = await sdk.getSecurityTokens({ walletAddress })
      dispatch({type: 'ASYNC_COMPLETE', tokens})
    }
    if (sdk && walletAddress && tokens.length === 0) {
      getTokens(dispatch, sdk, walletAddress)
    }
  }, [walletAddress, sdk, dispatch, tokens])

  // Load features status / available roles
  useEffect(() => {
    async function getFeaturesStatus() {
      dispatch({type: 'ASYNC_START', msg: 'Loading features status'})
      const featuresStatus = await token.features.getStatus()
      let availableRoles = []
      console.log(featuresStatus)
      const pmEnabled = featuresStatus[PERMISSIONS_FEATURE]
      delete featuresStatus[PERMISSIONS_FEATURE]
      if (pmEnabled) {
        availableRoles = await token.permissions.getAvailableRoles()
      }
      dispatch({type: 'ASYNC_COMPLETE', availableRoles, features: featuresStatus, pmEnabled})
    }
    if (token && !features) {
      getFeaturesStatus()
    }
  }, [dispatch, features, token])

  // Load delegates
  useEffect(() => {
    async function getDelegates() {
      dispatch({type: 'ASYNC_START', msg: 'Loading delegates'})
      const delegates = await await token.permissions.getAllDelegates()
      console.log('delegates', delegates)
      const records = delegates.reduce((acc, delegate, i) => {
        return acc.concat(delegate.roles.map(role => ({
          address: delegates[i].delegateAddress,
          role
        })))
      }, [])
      dispatch({type: 'ASYNC_COMPLETE', delegates, records})
    }
    if (token && pmEnabled) {
      getDelegates()
    }
  }, [pmEnabled, dispatch, token])

  const selectToken = (tokenIndex) => {
    dispatch({type: 'TOKEN_SELECTED', tokenIndex})
  }

  async function togglePM(enable) {
    try {
      dispatch({type: 'ASYNC_START', msg: 'Toggle role management'})
      if (enable) {
      // Enable module
        const queue = await token.features.enable({feature: PERMISSIONS_FEATURE})
        const result = await queue.run()
        console.log(result)
      } else {
      // Disable module
        const queue = await token.features.disable({feature: PERMISSIONS_FEATURE})
        const result = await queue.run()
        console.log(result)
      }
      dispatch({type: 'ASYNC_COMPLETE', pmEnabled: !enable})
    } catch (error) {
      console.error(error)
      dispatch({
        type: 'ASYNC_ERROR',
        error: error.message
      })
    }
  }

  const revokeRole = async (address, role) => {
    try {
      dispatch({type: 'ASYNC_START', msg: `Removing delegate ${address}`})
      const queue = await token.permissions.revokeRole({ delegateAddress: address, role })
      console.log(queue)
      // @FIXME an exception occurs here.
      const res = await queue.run()
      console.log('res', res)
      dispatch({type: 'ASYNC_COMPLETE'})
    } catch (error) {
      console.error(error)
      dispatch({
        type: 'ASYNC_ERROR',
        error: error.message
      })
    }
  }

  const assignRole = async (address, role) => {
    try {
      dispatch({type: 'ASYNC_START', msg: `Adding delegate ${address}`})
      const queue = await token.permissions.assignRole({ delegateAddress: address, role })
      console.log(queue)
      const res = await queue.run()
      dispatch({type: 'ASYNC_COMPLETE'})
    } catch (error) {
      console.error(error)
      dispatch({
        type: 'ERROR',
        error: error.message
      })
    }
  }

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
          <Layout>
            <Sider width={350}
              style={{
                padding: 50,
                backgroundColor: '#FAFDFF'
              }}
            >
              { walletAddress && tokens &&
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 250,
                  justifyContent: 'flex-start'
                }}>
                  <TokenSelector tokenSelectOpts={tokens.map((token, i) => ({label: token.symbol, value: i}))} onChange={selectToken} />
                </div>
              }
            </Sider>
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
              { token && features &&
                <Fragment>
                  <Divider orientation="left">Token features</Divider>
                  <Features features={features} pmEnabled={pmEnabled} onClick={togglePM} />
                </Fragment> }
              { token && availableRoles && records && <React.Fragment>
                <Divider orientation="left">Delegates (administrators and operators)</Divider>

                <PMDisplay
                  records={records}
                  roles={availableRoles}
                  revokeRole={revokeRole}
                  assignRole={assignRole}/>
              </React.Fragment> }
            </Content>
          </Layout>
        </Layout>
      </Spin>
    </div>
  )
}

export default App
