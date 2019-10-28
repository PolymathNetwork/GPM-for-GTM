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
  case 'LOADING_TOKENS':
    return {
      ...state,
      loading: true,
      loadingMessage: 'Loading tokens',
      error: undefined,
    }
  case 'TOKEN_SELECTED':
    const { tokenIndex } = action
    return {
      ...state,
      tokenIndex,
      pmEnabled: undefined,
      error: undefined,
      features: undefined
    }
  case 'LOADING_DELEGATES':
    return {
      ...state,
      loading: true,
      loadingMessage: 'Loading delegates',
      error: undefined,
    }
  case 'LOADING_FEATURES_STATUS':
    return {
      ...state,
      loading: true,
      error: undefined,
      loadingMessage: 'Loading features status'
    }
  case 'REMOVING_DELEGATE':
  case 'ADDING_DELEGATE':
    const { address } = action
    return {
      ...state,
      error: undefined,
      address,
      loading: true,
      loadingMessage: action.type === 'REMOVING_DELEGATE' ?
        `Revoking roles of ${address}` :
        `Adding delegate ${address}`
    }
  case 'LOADED_TOKENS':
  case 'TOGGLED_PM':
  case 'LOADED_DELEGATES':
  case 'REMOVED_DELEGATE':
  case 'ADDED_DELEGATE':
  case 'LOADED_FEATURES_STATUS':
    const { type, ...payload } = action
    return {
      ...state,
      ...payload,
      error: undefined,
      loading: false,
      loadingMessage: ''
    }
  case 'TOGGLING_PM':
    return {
      ...state,
      error: undefined,
      loading: true,
      loadingMessage: 'Toggling permission management'
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
    <Descriptions column={4} style={{marginBottom: 45}}>
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
    delegates,
    features,
    availableRoles
  } = state.AppReducer
  const token = tokens[tokenIndex]

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

  // Fetch tokens
  useEffect(() => {
    async function getTokens(dispatch, sdk, walletAddress) {
      dispatch({type: 'LOADING_TOKENS'})
      const tokens = await sdk.getSecurityTokens({ walletAddress })
      dispatch({type: 'LOADED_TOKENS', tokens})
    }
    if (sdk && walletAddress && tokens.length === 0) {
      getTokens(dispatch, sdk, walletAddress)
    }
  }, [walletAddress, sdk, dispatch, tokens])

  // Load features status / available roles
  useEffect(() => {
    async function getFeaturesStatus() {
      dispatch({type: 'LOADING_FEATURES_STATUS'})
      const featuresStatus = await token.features.getStatus()
      let availableRoles = []
      console.log(featuresStatus)
      const pmEnabled = featuresStatus[PERMISSIONS_FEATURE]
      delete featuresStatus[PERMISSIONS_FEATURE]
      if (pmEnabled) {
        availableRoles = await token.permissions.getAvailableRoles()
        dispatch({type: 'LOADED_FEATURES_STATUS', availableRoles, features: featuresStatus, pmEnabled})
      }
      dispatch({type: 'LOADED_FEATURES_STATUS', availableRoles, features: featuresStatus, pmEnabled})
    }
    if (token) {
      getFeaturesStatus()
    }
  }, [pmEnabled, dispatch, token])

  // Load delegates
  useEffect(() => {
    async function getDelegates() {
      dispatch({type: 'LOADING_DELEGATES'})
      const delegates = await await token.permissions.getAllDelegates()
      console.log('delegates', delegates)
      dispatch({type: 'LOADED_DELEGATES', delegates})
    }
    if (token && pmEnabled && features) {
      getDelegates()
    }
  }, [pmEnabled, dispatch, token, features])

  const selectToken = (tokenIndex) => {
    dispatch({type: 'TOKEN_SELECTED', tokenIndex})
  }

  async function togglePM(enable) {
    try {
      dispatch({type: 'TOGGLING_PM'})
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
      dispatch({type: 'TOGGLED_PM', pmEnabled: !enable})
    } catch (error) {
      console.error(error)
      dispatch({
        type: 'ERROR',
        error: error.message
      })
    }
  }

  const revokeRole = async (address, role) => {
    try {
      dispatch({type: 'REMOVING_DELEGATE', address})
      const queue = await token.permissions.revokeRole({ delegateAddress: address, role })
      console.log(queue)
      // @FIXME an exception occurs here.
      const res = await queue.run()
      console.log('res', res)
      dispatch({type: 'REMOVED_DELEGATE'})
    } catch (error) {
      console.error(error)
      dispatch({
        type: 'ERROR',
        error: error.message
      })
    }
  }

  const assignRole = async (address, role) => {
    try {
      dispatch({type: 'ADDING_DELEGATE', address})
      const queue = await token.permissions.assignRole({ delegateAddress: address, role })
      console.log(queue)
      const res = await queue.run()
      dispatch({type: 'ADDED_DELEGATE'})
    } catch (error) {
      console.error(error)
      dispatch({
        type: 'ERROR',
        error: error.message
      })
    }
  }


  const tokenSelectOpts = tokens.map((token, i) => ({label: token.symbol, value: i}))
  const records = delegates.reduce((acc, delegate, i) => {
    return acc.concat(delegate.roles.map(role => ({
      address: delegates[i].delegateAddress,
      role
    })))
  }, [])

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
              { walletAddress &&
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 250,
                  justifyContent: 'flex-start'
                }}>
                  <TokenSelector tokenSelectOpts={tokenSelectOpts} onChange={selectToken} />
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
              { token && features && availableRoles && records.length > 0 && <React.Fragment>
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
