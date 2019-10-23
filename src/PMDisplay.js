import React, {Fragment} from 'react'
import { Switch, Table, Typography, Button, Icon } from 'antd'

const {Column} = Table
const {Text} = Typography

export default function PMDisplay({enabled, onChange, delegates, removeDelegate}) {
  delegates = delegates.map(delegate => ({
    key: delegate,
    address: delegate
  }))
  return (
    <Fragment>
      <Switch checked={enabled} onChange={onChange} />
      <Table dataSource={delegates} rowKey="address">
        <Column
          title='Address'
          dataIndex='address'
          key='address'
          render={(text) => <Text>{text}</Text>}
        />
        <Column render={(text, record) => {
          return (
            <Fragment>
              <Button onClick={() => removeDelegate(record.address)}>
                <Icon type="delete" theme="filled" />
              </Button>
            </Fragment>
          )
        }}/>
      </Table>
    </Fragment>
  )
}