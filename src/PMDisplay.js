import React from 'react'
import { Switch } from 'antd'

export default function PMDisplay({enabled}) {
  return (
    <React.Fragment>
      <Switch checked={enabled} />
    </React.Fragment>
  )
}